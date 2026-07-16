// PLZ -> Stadt Lookup via OpenPLZ (openplzapi.org).
// Public API, no key needed. We fetch when PLZ has exactly 5 digits and cache
// the last successful lookup so consecutive edits don't re-fetch.

const API_BASE = 'https://openplzapi.org/de/Localities'

const cache = new Map<string, string>()

export async function lookupCity(postalCode: string): Promise<string | null> {
  if (!/^\d{5}$/.test(postalCode)) return null
  const cached = cache.get(postalCode)
  if (cached !== undefined) return cached

  try {
    const res = await fetch(`${API_BASE}?postalCode=${postalCode}`)
    if (!res.ok) return null
    const data = (await res.json()) as { name?: string }[]
    const city = data[0]?.name
    if (typeof city === 'string' && city.length > 0) {
      cache.set(postalCode, city)
      return city
    }
    return null
  } catch {
    return null
  }
}
