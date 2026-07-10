// Match Types.
// Zod-Schemas kommen hierher wenn wir die konkreten Felder mappen.

export type MatchId = string & { __brand: 'MatchId' }

export type MatchScore = number & { __brand: 'MatchScore' }
