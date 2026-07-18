// Data access for the job feed, matches, and mutual-match detection.
// RLS enforces per-seeker scoping so we always filter by session.user.id anyway.

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'

import { useSession } from './auth'
import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Row types (kept lean; joins return only what the UI needs)
// ---------------------------------------------------------------------------

export type MatchDecision = 'like' | 'pass' | 'pending'

export type JobRow = {
  id: string
  company_id: string
  title: string
  description: string | null
  status: 'draft' | 'active' | 'paused' | 'closed'
  match_threshold_pct: number
  location_lat: number | null
  location_lon: number | null
  remote_ok: boolean | null
  salary_min_eur: number | null
  salary_max_eur: number | null
}

export type CompanyRow = {
  id: string
  legal_name: string
  display_name: string
  pseudonym: string
  industry: string | null
  size_category: string | null
  logo_url: string | null
  show_anonymous: boolean
}

export type MatchRow = {
  id: string
  seeker_id: string
  job_id: string
  score_pct: number
  seeker_decision: MatchDecision
  recruiter_decision: MatchDecision
  is_mutual: boolean
  revealed_at: string | null
  created_at: string
}

export type MatchWithJob = MatchRow & {
  job: JobRow & { company: CompanyRow }
}

// ---------------------------------------------------------------------------
// Matchmaking (Edge Function trigger)
// ---------------------------------------------------------------------------

export async function runMatchmaking() {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) return { error: 'not authenticated', createdCount: 0 }

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  if (!url) return { error: 'missing supabase url', createdCount: 0 }

  const res = await fetch(`${url}/functions/v1/matching`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    return { error: `matchmaking failed: ${res.status}`, createdCount: 0 }
  }
  const body = (await res.json()) as { createdCount?: number; error?: string }
  return { error: body.error ?? null, createdCount: body.createdCount ?? 0 }
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

// All open matches (pending seeker decision), sorted by score desc.
export function useOpenMatches() {
  const { session } = useSession()
  const userId = session?.user.id
  const [items, setItems] = useState<MatchWithJob[]>([])
  const [isLoading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select(
        `id, seeker_id, job_id, score_pct, seeker_decision, recruiter_decision,
         is_mutual, revealed_at, created_at,
         job:jobs (
           id, company_id, title, description, status, match_threshold_pct,
           location_lat, location_lon, remote_ok, salary_min_eur, salary_max_eur,
           company:companies (
             id, legal_name, display_name, pseudonym, industry, size_category,
             logo_url, show_anonymous
           )
         )`,
      )
      .eq('seeker_id', userId)
      .eq('seeker_decision', 'pending')
      .order('score_pct', { ascending: false })
    setItems((data as unknown as MatchWithJob[]) ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, isLoading, refetch }
}

// One specific match by id, joined with job + company.
export function useMatchDetail(matchId: string | undefined) {
  const [match, setMatch] = useState<MatchWithJob | null>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) {
      setMatch(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('matches')
      .select(
        `id, seeker_id, job_id, score_pct, seeker_decision, recruiter_decision,
         is_mutual, revealed_at, created_at,
         job:jobs (
           id, company_id, title, description, status, match_threshold_pct,
           location_lat, location_lon, remote_ok, salary_min_eur, salary_max_eur,
           company:companies (
             id, legal_name, display_name, pseudonym, industry, size_category,
             logo_url, show_anonymous
           )
         )`,
      )
      .eq('id', matchId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setMatch((data as unknown as MatchWithJob | null) ?? null)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [matchId])

  return { match, isLoading }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function setSeekerDecision(matchId: string, decision: 'like' | 'pass') {
  const { error } = await supabase
    .from('matches')
    .update({
      seeker_decision: decision,
      seeker_decided_at: new Date().toISOString(),
    })
    .eq('id', matchId)
  return { error: error?.message ?? null }
}

// ---------------------------------------------------------------------------
// Realtime: mutual-match detection
// ---------------------------------------------------------------------------

export function useMutualMatchListener(onNewMutual: (matchId: string) => void) {
  const { session } = useSession()
  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`matches-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `seeker_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as MatchRow
          if (row.is_mutual) {
            onNewMutual(row.id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, onNewMutual])
}
