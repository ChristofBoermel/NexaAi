// Data access for the seeker onboarding + CV rendering.
// All calls run under RLS (auth.uid() = profile_id policies), so no service_role.
// Hooks return { data, isLoading, error, refetch }.

// The react-hooks/set-state-in-effect rule flags legitimate async data-fetch
// hooks where we set loading state at the start of the fetch. Disabling per file.
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from 'react'

import type {
  BasicsInput,
  EducationInput,
  WorkExperienceInput,
} from '@nexaai/types'

import { useSession } from './auth'
import { supabase } from './supabase'

export type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  role: 'seeker' | 'recruiter'
}

export type SeekerProfileRow = {
  profile_id: string
  job_title: string | null
  birth_year: number | null
  has_driver_license: boolean | null
  has_car: boolean | null
  postal_code: string | null
  city: string | null
  available_from: string | null
  salary_expectation_eur: number | null
  cv_approved_at: string | null
}

export type WorkExperienceRow = {
  id: string
  profile_id: string
  sort_order: number
  start_year: number
  start_month: number
  end_year: number | null
  end_month: number | null
  title: string
  subtitle: string | null
  description: string | null
}

export type EducationRow = {
  id: string
  profile_id: string
  sort_order: number
  start_year: number
  start_month: number
  end_year: number | null
  end_month: number | null
  title: string
  description: string | null
  status: string | null
}

export type SkillRow = {
  id: string
  slug: string
  display_name: string
  category: string | null
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useSeekerProfile() {
  const { session } = useSession()
  const userId = session?.user.id
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [seeker, setSeeker] = useState<SeekerProfileRow | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const [profileRes, seekerRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('seeker_profiles').select('*').eq('profile_id', userId).maybeSingle(),
    ])
    if (profileRes.error) setError(profileRes.error.message)
    if (seekerRes.error) setError(seekerRes.error.message)
    setProfile(profileRes.data)
    setSeeker(seekerRes.data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { profile, seeker, isLoading, error, refetch }
}

export function useWorkExperiences() {
  const { session } = useSession()
  const userId = session?.user.id
  const [items, setItems] = useState<WorkExperienceRow[]>([])
  const [isLoading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('work_experiences')
      .select('*')
      .eq('profile_id', userId)
      .order('sort_order', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, isLoading, refetch }
}

export function useEducations() {
  const { session } = useSession()
  const userId = session?.user.id
  const [items, setItems] = useState<EducationRow[]>([])
  const [isLoading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('educations')
      .select('*')
      .eq('profile_id', userId)
      .order('sort_order', { ascending: true })
    setItems(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, isLoading, refetch }
}

export function useSeekerSkills() {
  const { session } = useSession()
  const userId = session?.user.id
  const [items, setItems] = useState<SkillRow[]>([])
  const [isLoading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('seeker_skills')
      .select('skill:skills(*)')
      .eq('profile_id', userId)
    const rows = (data ?? []).map((r) => r.skill as unknown as SkillRow).filter(Boolean)
    setItems(rows)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { items, isLoading, refetch }
}

export function useAllSkills() {
  const [items, setItems] = useState<SkillRow[]>([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase
      .from('skills')
      .select('id, slug, display_name, category')
      .order('display_name', { ascending: true })
      .then(({ data }) => {
        if (!mounted) return
        setItems(data ?? [])
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { items, isLoading }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveBasics(userId: string, input: BasicsInput) {
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ first_name: input.firstName, last_name: input.lastName })
    .eq('id', userId)
  if (profileErr) return { error: profileErr.message }

  const { error: seekerErr } = await supabase
    .from('seeker_profiles')
    .upsert({
      profile_id: userId,
      job_title: input.jobTitle,
      birth_year: input.birthYear ?? null,
      postal_code: input.postalCode,
      city: input.city,
      has_driver_license: input.hasDriverLicense,
      has_car: input.hasCar,
      available_from: input.availableFrom,
      salary_expectation_eur: input.salaryExpectation ?? null,
    })
  if (seekerErr) return { error: seekerErr.message }

  return { error: null }
}

export async function saveJobTitle(userId: string, jobTitle: string) {
  const { error } = await supabase
    .from('seeker_profiles')
    .upsert({ profile_id: userId, job_title: jobTitle })
  return { error: error?.message ?? null }
}

export async function upsertWorkExperience(
  userId: string,
  input: WorkExperienceInput & { id?: string; sortOrder?: number },
) {
  const row = {
    id: input.id,
    profile_id: userId,
    sort_order: input.sortOrder ?? 0,
    title: input.title,
    subtitle: input.subtitle ?? null,
    start_month: input.startMonth,
    start_year: input.startYear,
    end_month: input.endMonth ?? null,
    end_year: input.endYear ?? null,
    description: input.description ?? null,
  }
  const { data, error } = await supabase
    .from('work_experiences')
    .upsert(row)
    .select()
    .single()
  return { data, error: error?.message ?? null }
}

export async function deleteWorkExperience(id: string) {
  const { error } = await supabase.from('work_experiences').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export async function upsertEducation(
  userId: string,
  input: EducationInput & { id?: string; sortOrder?: number },
) {
  const row = {
    id: input.id,
    profile_id: userId,
    sort_order: input.sortOrder ?? 0,
    title: input.title,
    start_month: input.startMonth,
    start_year: input.startYear,
    end_month: input.endMonth ?? null,
    end_year: input.endYear ?? null,
    description: input.description ?? null,
    status: input.status ?? null,
  }
  const { data, error } = await supabase
    .from('educations')
    .upsert(row)
    .select()
    .single()
  return { data, error: error?.message ?? null }
}

export async function deleteEducation(id: string) {
  const { error } = await supabase.from('educations').delete().eq('id', id)
  return { error: error?.message ?? null }
}

// Replaces the seeker_skills set for this user.
// Simplest: delete-then-insert; the table is tiny per user (max 6 rows).
export async function saveSeekerSkills(userId: string, skillIds: string[]) {
  const { error: delErr } = await supabase
    .from('seeker_skills')
    .delete()
    .eq('profile_id', userId)
  if (delErr) return { error: delErr.message }

  if (skillIds.length === 0) return { error: null }

  const rows = skillIds.map((id) => ({
    profile_id: userId,
    skill_id: id,
    level: 'intermediate' as const,
  }))
  const { error: insErr } = await supabase.from('seeker_skills').insert(rows)
  return { error: insErr?.message ?? null }
}

export async function approveCv(userId: string) {
  const { error } = await supabase
    .from('seeker_profiles')
    .upsert({ profile_id: userId, cv_approved_at: new Date().toISOString() })
  return { error: error?.message ?? null }
}
