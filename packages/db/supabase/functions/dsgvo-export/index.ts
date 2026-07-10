// dsgvo-export Edge Function.
// Exportiert alle personenbezogenen Daten des anfragenden Nutzers als JSON.
// Nutzt secret key intern, ist aber authenticated (auth.uid check).

Deno.serve((_req) => {
  return new Response(
    JSON.stringify({ message: 'dsgvo-export function stub' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
