import { z } from "zod"

export const createChangePasswordSchema = (msg?: {
  currentPasswordRequired?: string
  newPasswordMin?: string
}) =>
  z.object({
    currentPassword: z
      .string()
      .min(
        1,
        msg?.currentPasswordRequired
          ? { message: msg.currentPasswordRequired }
          : undefined
      ),
    newPassword: z
      .string()
      .min(
        6,
        msg?.newPasswordMin ? { message: msg.newPasswordMin } : undefined
      ),
  })

export const ChangePasswordSchema = createChangePasswordSchema()
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>
