// ai-job-writer Edge Function.
// Erzeugt eine Job-Anzeige aus Rolle und Anforderungen via DeepSeek.

Deno.serve((_req) => {
  return new Response(
    JSON.stringify({ message: 'ai-job-writer function stub' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
