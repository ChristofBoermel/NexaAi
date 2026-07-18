// notify Edge Function.
// Receives database webhook payloads and fans out through Expo Push Service.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

import { corsHeaders } from '../_shared/cors.ts'

type NotifyPayload = {
  type: 'match' | 'message'
  matchId: string
  targetProfileId: string
  messageId?: string
  senderId?: string
}

type PushTokenRow = {
  id: string
  expo_push_token: string
}

type ExpoTicket = {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

type ExpoReceipt = {
  status: 'ok' | 'error'
  message?: string
  details?: { error?: string }
}

type DbClient = ReturnType<typeof createClient<any, 'public', any>>

const expoSendUrl = 'https://exp.host/--/api/v2/push/send'
const expoReceiptsUrl = 'https://exp.host/--/api/v2/push/getReceipts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const webhookSecret = Deno.env.get('FUNCTION_WEBHOOK_SECRET')
  if (webhookSecret && req.headers.get('x-nexaai-webhook-secret') !== webhookSecret) {
    return json({ error: 'Invalid webhook secret' }, 401)
  }

  const payload = parsePayload(await req.json().catch(() => null))
  if (!payload) {
    return json({ error: 'Invalid payload' }, 400)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY')

  if (!url || !serviceKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  })

  const rateLimitSince = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count, error: countError } = await supabase
    .from('notification_deliveries')
    .select('id', { count: 'exact', head: true })
    .eq('target_profile_id', payload.targetProfileId)
    .gte('created_at', rateLimitSince)

  if (countError) {
    return json({ error: countError.message }, 500)
  }

  if ((count ?? 0) >= 5) {
    return json({ skipped: true, reason: 'rate_limited' }, 200)
  }

  const { data: tokens, error: tokenError } = await supabase
    .from('push_tokens')
    .select('id, expo_push_token')
    .eq('profile_id', payload.targetProfileId)
    .eq('enabled', true)
    .is('revoked_at', null)

  if (tokenError) {
    return json({ error: tokenError.message }, 500)
  }

  const activeTokens = (tokens ?? []) as PushTokenRow[]
  if (activeTokens.length === 0) {
    return json({ sent: 0 }, 200)
  }

  const messages = activeTokens.slice(0, 5).map((token) => ({
    to: token.expo_push_token,
    title: payload.type === 'match' ? 'Neues Match' : 'Neue Nachricht',
    body:
      payload.type === 'match'
        ? 'Ein Recruiter hat ebenfalls Interesse gezeigt.'
        : 'Du hast eine neue Chat-Nachricht.',
    sound: 'default',
    channelId: 'matches',
    data: {
      type: payload.type,
      matchId: payload.matchId,
      url:
        payload.type === 'match'
          ? `/(app)/match/${payload.matchId}`
          : `/(app)/chat/${payload.matchId}`,
    },
  }))

  const ticketResponse = await fetch(expoSendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  })

  if (!ticketResponse.ok) {
    return json({ error: 'Expo push request failed' }, 502)
  }

  const ticketBody = (await ticketResponse.json()) as { data?: ExpoTicket[] }
  const tickets = ticketBody.data ?? []
  const receiptIds: string[] = []

  await Promise.all(
    activeTokens.slice(0, 5).map(async (token, index) => {
      const ticket = tickets[index]
      if (ticket?.id) receiptIds.push(ticket.id)

      await supabase.from('notification_deliveries').insert({
        target_profile_id: payload.targetProfileId,
        push_token_id: token.id,
        event_kind: payload.type,
        related_match_id: payload.matchId,
        expo_ticket_id: ticket?.id ?? null,
        status: ticket?.status ?? 'unknown',
        error_code: ticket?.details?.error ?? null,
      })

      if (ticket?.details?.error === 'DeviceNotRegistered') {
        await revokeToken(supabase, token.id)
      }
    }),
  )

  if (receiptIds.length > 0) {
    await handleReceipts(supabase, receiptIds)
  }

  return json({ sent: tickets.filter((ticket) => ticket.status === 'ok').length }, 200)
})

function parsePayload(value: unknown): NotifyPayload | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const type = record.type
  const matchId = record.matchId
  const targetProfileId = record.targetProfileId

  if ((type !== 'match' && type !== 'message') || typeof matchId !== 'string') {
    return null
  }

  if (typeof targetProfileId !== 'string') {
    return null
  }

  return {
    type,
    matchId,
    targetProfileId,
    messageId: typeof record.messageId === 'string' ? record.messageId : undefined,
    senderId: typeof record.senderId === 'string' ? record.senderId : undefined,
  }
}

async function handleReceipts(supabase: DbClient, receiptIds: string[]) {
  const response = await fetch(expoReceiptsUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: receiptIds }),
  })

  if (!response.ok) return

  const body = (await response.json()) as { data?: Record<string, ExpoReceipt> }
  const receipts = body.data ?? {}

  await Promise.all(
    Object.entries(receipts).map(async ([receiptId, receipt]) => {
      if (receipt.status === 'ok') return

      const { data } = (await supabase
        .from('notification_deliveries')
        .select('push_token_id')
        .eq('expo_ticket_id', receiptId)
        .maybeSingle()) as { data?: { push_token_id?: string } | null }

      if (receipt.details?.error === 'DeviceNotRegistered' && data?.push_token_id) {
        await revokeToken(supabase, data.push_token_id)
      }
    }),
  )
}

async function revokeToken(supabase: DbClient, pushTokenId: string) {
  await supabase
    .from('push_tokens')
    .update({
      enabled: false,
      revoked_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', pushTokenId)
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
