// dsgvo-delete Edge Function.
// Startet 30-Tage-Loeschfrist fuer den anfragenden Nutzer.
// Setzt deleted_at auf Antragsdatum, tatsaechliche Loeschung via Cron nach 30 Tagen.

Deno.serve((_req) => {
  return new Response(
    JSON.stringify({ message: 'dsgvo-delete function stub' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
