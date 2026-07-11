// Auth-Formular-Schemas.
// Werden im Mobile-App via @hookform/resolvers/zod eingebunden.
// Fehler-Messages sind deutsch weil sie direkt im UI auftauchen.

import { z } from 'zod'

export const emailSchema = z
  .string()
  .min(1, 'Bitte gib deine E-Mail-Adresse ein')
  .email('Das sieht nicht wie eine E-Mail-Adresse aus')

export const passwordSchema = z
  .string()
  .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/[0-9]/, 'Das Passwort muss mindestens eine Ziffer enthalten')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Bitte gib dein Passwort ein'),
})

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Die Passwoerter stimmen nicht ueberein',
    path: ['passwordConfirm'],
  })

export const resetRequestSchema = z.object({
  email: emailSchema,
})

export const resetConfirmSchema = z
  .object({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Die Passwoerter stimmen nicht ueberein',
    path: ['passwordConfirm'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ResetRequestInput = z.infer<typeof resetRequestSchema>
export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>
