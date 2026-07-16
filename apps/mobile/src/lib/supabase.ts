// Supabase Client für die Mobile-App.
//
// Session-Tokens werden über expo-sqlite/kv-store persistiert. SecureStore ist
// auf iOS auf 2 KB pro Key limitiert, Supabase-Tokens koennen groesser werden.
// SQLite hat kein Limit und ist auf beiden Plattformen stabil.
//
// Publishable Key darf im Client stehen (per Design). Secret Key niemals hier.
// Siehe skills/nexaai-database/SKILL.md.

import Storage from 'expo-sqlite/kv-store'
import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL oder EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlt in .env.local',
  )
}

// Storage is a pre-instantiated SQLiteStorage singleton from expo-sqlite/kv-store.
// Its methods are named getItemAsync/setItemAsync/removeItemAsync, so we wrap them
// into the plain getItem/setItem/removeItem shape Supabase-JS expects.
export const supabase = createClient(url, key, {
  auth: {
    storage: {
      getItem: (k: string) => Storage.getItemAsync(k),
      setItem: (k: string, v: string) => Storage.setItemAsync(k, v),
      removeItem: (k: string) => Storage.removeItemAsync(k).then(() => undefined),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
