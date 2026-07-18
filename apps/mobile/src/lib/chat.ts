// Data access for mutual matches and realtime chat messages.
// RLS scopes all reads and writes to the signed-in seeker.

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'

import { sendMessageSchema } from '@nexaai/types'

import { useSession } from './auth'
import { supabase } from './supabase'

export type MessageRow = {
  id: string
  match_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export type ChatCompanyRow = {
  id: string
  display_name: string
  logo_url: string | null
}

export type ChatJobRow = {
  id: string
  title: string
  company: ChatCompanyRow
}

export type MutualMatchRow = {
  id: string
  seeker_id: string
  job_id: string
  created_at: string
  job: ChatJobRow
  messages?: MessageRow[]
}

export function useMatches(kind: 'mutual') {
  const { session } = useSession()
  const userId = session?.user.id
  const [items, setItems] = useState<MutualMatchRow[]>([])
  const [isLoading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId || kind !== 'mutual') return
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select(
        `id, seeker_id, job_id, created_at,
         job:jobs (
           id, title,
           company:companies (id, display_name, logo_url)
         ),
         messages (
           id, match_id, sender_id, body, read_at, created_at
         )`,
      )
      .eq('seeker_id', userId)
      .eq('is_mutual', true)
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'messages', ascending: false })
      .limit(1, { referencedTable: 'messages' })

    setItems((data as unknown as MutualMatchRow[]) ?? [])
    setLoading(false)
  }, [kind, userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, isLoading, refetch }
}

export function useMessages(matchId: string | undefined) {
  const [items, setItems] = useState<MessageRow[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) {
      setItems([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    supabase
      .from('messages')
      .select('id, match_id, sender_id, body, read_at, created_at')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setItems((data as MessageRow[]) ?? [])
        setLoading(false)
      })

    const channel = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow
          setItems((current) => {
            if (current.some((item) => item.id === row.id)) return current
            return [...current, row]
          })
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [matchId])

  return { items, isLoading }
}

export async function sendMessage(matchId: string, body: string) {
  const parsed = sendMessageSchema.safeParse({ body: body.trim() })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Nachricht ist ungültig' }
  }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return { error: 'Bitte melde dich erneut an' }

  const { error } = await supabase.from('messages').insert({
    match_id: matchId,
    sender_id: userId,
    body: parsed.data.body,
  })

  return { error: error?.message ?? null }
}

export async function markRead(messageIds: string[]) {
  if (messageIds.length === 0) return { error: null }

  const { data: userData } = await supabase.auth.getUser()
  const userId = userData.user?.id
  if (!userId) return { error: 'Bitte melde dich erneut an' }

  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .in('id', messageIds)
    .is('read_at', null)
    .neq('sender_id', userId)

  return { error: error?.message ?? null }
}
