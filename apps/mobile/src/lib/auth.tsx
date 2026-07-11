// SessionProvider haelt die aktuelle Supabase-Session im React-Tree.
// useSession() liest Session + Loading-State fuer Guards und UI.
// signInWithPassword / signUpWithPassword / signOut sind thin wrappers,
// damit Screens nicht direkt auf supabase.auth zugreifen muessen.

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from './supabase'

type SessionState = {
  session: Session | null
  isLoading: boolean
}

const SessionContext = createContext<SessionState>({
  session: null,
  isLoading: true,
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
  })

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setState({ session: data.session, isLoading: false })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setState({ session, isLoading: false })
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error }
}

export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Loesst eine Passwort-Reset-Email aus.
// redirectTo verweist auf unseren Deep-Link Handler in Chunk C.
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'nexaai://reset-callback',
  })
  return { error }
}

// Setzt das Passwort fuer die aktuell eingeloggte Session neu.
// Der Reset-Callback muss vorher via Deep-Link eine Recovery-Session etabliert haben.
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error }
}
