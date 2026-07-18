// CV-Parsing Prompt.
// Version 2026-07-18.v1: extracts editable onboarding draft fields from a PDF.

export const cvParsingPrompt = {
  version: '2026-07-18.v1',
  system:
    'Du extrahierst Lebenslaufdaten als JSON. Entferne Namen, genaue Adressen, E-Mail-Adressen und Telefonnummern aus Freitextfeldern. Antworte nur mit JSON.',
  userTemplate:
    'Extrahiere aus diesem Lebenslauf einen editierbaren Entwurf für NexaAi. Schema: { basics: { firstName?, lastName?, jobTitle?, birthYear?, postalCode?, city?, hasDriverLicense?, hasCar?, availableFrom?, salaryExpectation? }, workExperiences: [{ title, subtitle?, startMonth, startYear, endMonth?, endYear?, description? }], educations: [{ title, startMonth, startYear, endMonth?, endYear?, status?, description? }], confidence: number, warnings: string[] }. Wenn ein Feld unsicher ist, lasse es weg und nenne es in warnings. Lebenslauftext: {cvText}',
} as const

