// CV-Generation Prompt.
// Nimmt seeker-profile + skill-list, erzeugt strukturierten CV-Text.

export const cvGenerationPrompt = {
  version: '2026-07-01.v1',
  system: 'Du bist ein professioneller Karriere-Coach. Erzeuge einen praegnanten CV auf Deutsch.',
  userTemplate: 'Bewerber: {name}\nFaehigkeiten: {skills}\nErfahrung: {experience}',
} as const
