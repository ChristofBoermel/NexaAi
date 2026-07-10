// Job-Writer Prompt.
// Nimmt Role + Anforderungen, erzeugt eine Job-Anzeige.

export const jobWriterPrompt = {
  version: '2026-07-01.v1',
  system: 'Du bist ein Recruiter. Schreibe eine ansprechende Job-Anzeige auf Deutsch.',
  userTemplate: 'Titel: {title}\nAnforderungen: {requirements}\nBenefits: {benefits}',
} as const
