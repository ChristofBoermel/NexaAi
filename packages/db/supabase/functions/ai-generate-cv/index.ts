// ai-generate-cv Edge Function.
// Erzeugt einen CV-Text aus seeker-profile via DeepSeek (mit Mistral-Fallback).

Deno.serve((_req) => {
  return new Response(
    JSON.stringify({ message: 'ai-generate-cv function stub' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
