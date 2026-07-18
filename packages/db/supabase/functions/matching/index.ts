// matching Edge Function.
// Called by the mobile app after the seeker approves their CV. Runs the
// Postgres function `create_matches_for_seeker` under the caller's identity,
// so RLS ensures the seeker can only trigger matches for themselves.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return json({ error: 'Missing authorization header' }, 401)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    return json({ error: 'Invalid session' }, 401)
  }

  const { data, error } = await supabase.rpc('create_matches_for_seeker', {
    p_seeker_id: userData.user.id,
    p_limit: 20,
  })

  if (error) {
    return json({ error: error.message }, 500)
  }

  return json({ createdCount: data ?? 0 }, 200)
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}
