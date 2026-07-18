// CV upload and parse helpers.
// The parsed result stays a draft until the user reviews the wizard.

import * as DocumentPicker from 'expo-document-picker'

import { parsedCvDraftSchema, type ParsedCvDraft } from '@nexaai/types'

import { supabase } from './supabase'

const maxPdfBytes = 5 * 1024 * 1024
const rawCvBucket = 'raw-cvs'

let parsedCvDraft: ParsedCvDraft | null = null

export async function pickCvPdf() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    multiple: false,
    copyToCacheDirectory: true,
  })

  if (result.canceled) {
    return { asset: null, error: null }
  }

  const asset = result.assets[0]
  if (!asset) {
    return { asset: null, error: 'Die Datei konnte nicht gelesen werden' }
  }

  if (asset.size != null && asset.size > maxPdfBytes) {
    return { asset: null, error: 'Die PDF darf maximal 5 MB groß sein' }
  }

  if (asset.mimeType && asset.mimeType !== 'application/pdf') {
    return { asset: null, error: 'Bitte wähle eine PDF-Datei aus' }
  }

  if (!asset.name.toLowerCase().endsWith('.pdf')) {
    return { asset: null, error: 'Bitte wähle eine PDF-Datei aus' }
  }

  return { asset, error: null }
}

export async function uploadRawCv(profileId: string, asset: DocumentPicker.DocumentPickerAsset) {
  const uploadId = crypto.randomUUID()
  const storagePath = `${profileId}/${uploadId}.pdf`
  const response = await fetch(asset.uri)
  const blob = await response.blob()

  if (blob.size > maxPdfBytes) {
    return { storagePath: null, error: 'Die PDF darf maximal 5 MB groß sein' }
  }

  if (blob.type && blob.type !== 'application/pdf') {
    return { storagePath: null, error: 'Bitte wähle eine PDF-Datei aus' }
  }

  const { error: metadataError } = await supabase.from('raw_cv_uploads').insert({
    id: uploadId,
    profile_id: profileId,
    storage_path: storagePath,
  })

  if (metadataError) {
    return { storagePath: null, error: metadataError.message }
  }

  const { error } = await supabase.storage
    .from(rawCvBucket)
    .upload(storagePath, blob, {
      contentType: 'application/pdf',
      upsert: false,
    })

  return { storagePath: error ? null : storagePath, error: error?.message ?? null }
}

export async function parseUploadedCv(storagePath: string) {
  const { data, error } = await supabase.functions.invoke('parse-cv', {
    body: { storagePath },
  })

  if (error) {
    return { draft: null, error: error.message }
  }

  const parsed = parsedCvDraftSchema.safeParse(data)
  if (!parsed.success) {
    return { draft: null, error: 'Der CV-Entwurf konnte nicht verarbeitet werden' }
  }

  parsedCvDraft = parsed.data
  return { draft: parsed.data, error: null }
}

export function getParsedCvDraft() {
  return parsedCvDraft
}

export function clearParsedCvDraft() {
  parsedCvDraft = null
}
