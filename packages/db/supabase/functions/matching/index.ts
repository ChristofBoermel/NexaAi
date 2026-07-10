// matching Edge Function
// Computes match scores between a seeker and relevant jobs.
// Called from the mobile app when the seeker opens their feed.

Deno.serve((_req) => {
  return new Response(
    JSON.stringify({ message: 'matching function stub' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
