// parse-cv Edge Function.
// Authenticated PDF parser that returns an editable onboarding draft.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

import { cvParsingPrompt } from '../../../../prompts/src/cv-parsing.ts'
import { corsHeaders } from '../_shared/cors.ts'

type ParsedCvDraft = {
  basics: Record<string, unknown>
  workExperiences: Record<string, unknown>[]
  educations: Record<string, unknown>[]
  confidence: number
  warnings: string[]
}

type ParseResult = {
  draft: ParsedCvDraft
  model: string
}

const maxPdfBytes = 5 * 1024 * 1024
const maxPromptChars = 20000
const promptVersion = cvParsingPrompt.version

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')

  if (!url || !anonKey || !serviceKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Invalid session' }, 401)
  }

  const body = await req.json().catch(() => null)
  const storagePath = parseStoragePath(body)
  if (!storagePath || !storagePath.startsWith(`${userData.user.id}/`)) {
    return json({ error: 'Invalid storage path' }, 400)
  }

  const rateLimitSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count, error: countError } = await userClient
    .from('ai_generations')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', userData.user.id)
    .eq('kind', 'cv_draft')
    .gte('created_at', rateLimitSince)

  if (countError) {
    return json({ error: countError.message }, 500)
  }

  if ((count ?? 0) >= 1) {
    return json({ error: 'Du kannst einen CV pro Tag automatisch auslesen lassen' }, 429)
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  const { data: fileBlob, error: downloadError } = await admin.storage
    .from('raw-cvs')
    .download(storagePath)

  if (downloadError || !fileBlob) {
    return json({ error: 'Die PDF konnte nicht geladen werden' }, 404)
  }

  if (fileBlob.size > maxPdfBytes || fileBlob.type !== 'application/pdf') {
    return json({ error: 'Die Datei muss eine PDF bis 5 MB sein' }, 400)
  }

  const buffer = new Uint8Array(await fileBlob.arrayBuffer())
  if (!hasPdfSignature(buffer)) {
    return json({ error: 'Die Datei hat keine gültige PDF-Signatur' }, 400)
  }

  const rawText = extractPdfText(buffer)
  if (rawText.length < 80) {
    return json({ error: 'Aus dieser PDF konnte kein Text gelesen werden' }, 422)
  }

  const minimizedText = stripPII(rawText).slice(0, maxPromptChars)
  const inputHash = await sha256(minimizedText)
  const parseResult = await parseWithLlm(minimizedText)

  if (!parseResult) {
    return json({ error: 'Der CV konnte nicht strukturiert werden' }, 502)
  }

  const { error: generationError } = await admin.from('ai_generations').insert({
    profile_id: userData.user.id,
    kind: 'cv_draft',
    model: parseResult.model,
    input_hash: inputHash,
    output_text: JSON.stringify({
      promptVersion,
      draft: parseResult.draft,
    }),
    approved: false,
  })

  if (generationError) {
    return json({ error: generationError.message }, 500)
  }

  await admin
    .from('raw_cv_uploads')
    .update({ parsed_at: new Date().toISOString() })
    .eq('storage_path', storagePath)
    .eq('profile_id', userData.user.id)

  return json(parseResult.draft, 200)
})

function parseStoragePath(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const storagePath = (value as Record<string, unknown>).storagePath
  if (typeof storagePath !== 'string') return null
  if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.pdf$/i.test(storagePath)) return null
  return storagePath
}

function hasPdfSignature(buffer: Uint8Array) {
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  )
}

function extractPdfText(buffer: Uint8Array) {
  const decoded = new TextDecoder('latin1').decode(buffer)
  const textChunks = decoded
    .replace(/\r/g, '\n')
    .split(/\n|\\n|\)|\(/)
    .map((part) => part.replace(/\\[()\\]/g, '').replace(/[^\S\n]+/g, ' ').trim())
    .filter((part) => /[A-Za-zÄÖÜäöüß]{3,}/.test(part))

  return textChunks.join('\n').slice(0, maxPromptChars)
}

function stripPII(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email entfernt]')
    .replace(/\b(?:\+49|0049|0)[1-9][0-9\s/-]{6,}\b/g, '[telefon entfernt]')
    .replace(/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g, '[datum entfernt]')
}

async function parseWithLlm(cvText: string) {
  const deepSeekKey = Deno.env.get('DEEPSEEK_API_KEY')
  if (deepSeekKey) {
    const draft = await callDeepSeek(deepSeekKey, cvText)
    if (draft) return { draft, model: 'deepseek-chat' }
  }

  const mistralKey = Deno.env.get('MISTRAL_API_KEY')
  if (!mistralKey) return null
  const draft = await callMistral(mistralKey, cvText)
  return draft ? { draft, model: 'mistral-small-latest' } : null
}

async function callDeepSeek(apiKey: string, cvText: string) {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: cvParsingPrompt.system },
        {
          role: 'user',
          content: cvParsingPrompt.userTemplate.replace('{cvText}', cvText),
        },
      ],
    }),
  })

  if (!response.ok) return null
  const body = await response.json()
  return parseDraft(body?.choices?.[0]?.message?.content)
}

async function callMistral(apiKey: string, cvText: string) {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: cvParsingPrompt.system },
        {
          role: 'user',
          content: cvParsingPrompt.userTemplate.replace('{cvText}', cvText),
        },
      ],
    }),
  })

  if (!response.ok) return null
  const body = await response.json()
  return parseDraft(body?.choices?.[0]?.message?.content)
}

function parseDraft(content: unknown): ParsedCvDraft | null {
  if (typeof content !== 'string') return null
  const jsonText = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  let value: ParsedCvDraft

  try {
    value = JSON.parse(jsonText) as ParsedCvDraft
  } catch {
    return null
  }

  if (!value || typeof value !== 'object') return null
  if (!Array.isArray(value.workExperiences) || !Array.isArray(value.educations)) return null
  if (!Array.isArray(value.warnings)) value.warnings = []
  if (typeof value.confidence !== 'number') value.confidence = 0
  if (!value.basics || typeof value.basics !== 'object') value.basics = {}

  return {
    basics: value.basics,
    workExperiences: value.workExperiences.slice(0, 12),
    educations: value.educations.slice(0, 8),
    confidence: Math.max(0, Math.min(1, value.confidence)),
    warnings: value.warnings.slice(0, 10),
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  )
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
