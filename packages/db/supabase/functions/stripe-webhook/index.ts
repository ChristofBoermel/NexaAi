// stripe-webhook Edge Function.
// Empfaengt Stripe-Events (Subscription-Updates, Payments) und synct sie in unsere DB.
// JWT-Verifikation MUSS hier ausgeschaltet werden, Stripe signiert via Header.

Deno.serve((_req) => {
  return new Response(
    JSON.stringify({ message: 'stripe-webhook function stub' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
