import { z } from "zod"
import { PhoneRegex } from "../common/index.js"

export const createLoginSchema = (msg?: {
  phoneRegex?: string
  passwordMin?: string
}) =>
  z.object({
    phone: z
      .string()
      .trim()
      .regex(
        PhoneRegex,
        msg?.phoneRegex ? { message: msg.phoneRegex } : undefined
      ),
    password: z
      .string()
      .min(6, msg?.passwordMin ? { message: msg.passwordMin } : undefined),
    subdomain: z.string().trim().optional(),
  })

export const LoginInputSchema = createLoginSchema()
export type LoginInput = z.infer<typeof LoginInputSchema>
