// Supabase Client fuer die Mobile-App.
//
// Session-Tokens werden ueber expo-sqlite/localStorage persistiert (siehe
// _layout.tsx: der Polyfill wird vor allem anderen installiert und macht
// globalThis.localStorage verfuegbar). Supabase-JS erkennt localStorage und
// nutzt es automatisch als Session-Storage.
//
// Publishable Key darf im Client stehen (per Design). Secret Key niemals hier.
// Siehe skills/nexaai-database/SKILL.md.

import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL oder EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlt in .env.local',
  )
}

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
