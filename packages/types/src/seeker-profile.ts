// Seeker onboarding schemas.
// Every field the Nexa Consulting CV format needs, with German error messages.

import { z } from 'zod'

const currentYear = new Date().getFullYear()

const monthSchema = z
  .number({ invalid_type_error: 'Bitte Monat wählen' })
  .int()
  .min(1, 'Ungültiger Monat')
  .max(12, 'Ungültiger Monat')

const yearSchema = z
  .number({ invalid_type_error: 'Bitte Jahr wählen' })
  .int()
  .min(1950, 'Jahr liegt zu weit zurück')
  .max(currentYear + 5, 'Jahr liegt zu weit in der Zukunft')

const postalCodeSchema = z
  .string()
  .regex(/^[0-9]{5}$/, 'PLZ muss aus 5 Ziffern bestehen')

export const basicsSchema = z.object({
  firstName: z.string().min(1, 'Bitte gib deinen Vornamen ein').max(60),
  lastName: z.string().min(1, 'Bitte gib deinen Nachnamen ein').max(60),
  jobTitle: z
    .string()
    .min(2, 'Bitte gib deine Berufsbezeichnung ein')
    .max(80, 'Die Berufsbezeichnung ist zu lang'),
  birthYear: z
    .number()
    .int()
    .min(1900, 'Ungültiges Geburtsjahr')
    .max(currentYear, 'Ungültiges Geburtsjahr')
    .optional(),
  postalCode: postalCodeSchema,
  city: z.string().min(1, 'Bitte gib deine Stadt ein').max(80),
  hasDriverLicense: z.boolean(),
  hasCar: z.boolean(),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum'),
  salaryExpectation: z
    .number()
    .int()
    .min(0)
    .max(1_000_000, 'Ungültige Gehaltsangabe')
    .optional(),
})

const timeRangeRefine = <T extends {
  startYear: number
  startMonth: number
  endYear?: number | null
  endMonth?: number | null
}>(data: T) => {
  if (data.endYear == null || data.endMonth == null) return true
  const start = data.startYear * 12 + data.startMonth
  const end = data.endYear * 12 + data.endMonth
  return start <= end
}

export const workExperienceSchema = z
  .object({
    title: z.string().min(1, 'Bitte gib einen Titel ein').max(120),
    subtitle: z.string().max(120).optional().nullable(),
    startMonth: monthSchema,
    startYear: yearSchema,
    endMonth: monthSchema.optional().nullable(),
    endYear: yearSchema.optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
  })
  .refine(timeRangeRefine, {
    message: 'Das Enddatum liegt vor dem Startdatum',
    path: ['endYear'],
  })

export const educationSchema = z
  .object({
    title: z.string().min(1, 'Bitte gib einen Titel ein').max(120),
    startMonth: monthSchema,
    startYear: yearSchema,
    endMonth: monthSchema.optional().nullable(),
    endYear: yearSchema.optional().nullable(),
    status: z.string().max(120).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
  })
  .refine(timeRangeRefine, {
    message: 'Das Enddatum liegt vor dem Startdatum',
    path: ['endYear'],
  })

export const skillSelectionSchema = z
  .array(z.string().uuid())
  .min(1, 'Bitte wähle mindestens einen Skill')
  .max(6, 'Maximal 6 Skills möglich')

export type BasicsInput = z.infer<typeof basicsSchema>
export type WorkExperienceInput = z.infer<typeof workExperienceSchema>
export type EducationInput = z.infer<typeof educationSchema>
export type SkillSelectionInput = z.infer<typeof skillSelectionSchema>
