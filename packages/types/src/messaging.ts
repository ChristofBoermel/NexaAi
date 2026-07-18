// Messaging schemas.
// Error messages are German because they are shown directly in the UI.

import { z } from 'zod'

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Nachricht darf nicht leer sein').max(2000),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
