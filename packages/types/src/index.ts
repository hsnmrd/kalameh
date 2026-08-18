import { z } from "zod"

// Re-export zod
export * from "zod"

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------
export const RoleEnum = z.enum([
  "SUPER_ADMIN",
  "INSTITUTE_ADMIN",
  "CLERK",
  "STUDENT",
])
export type Role = z.infer<typeof RoleEnum>

// ---------------------------------------------------------------------------
// Authentication Schemas
// ---------------------------------------------------------------------------
export const PhoneRegex = /^09\d{9}$/

export const LoginInputSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      PhoneRegex,
      "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)"
    ),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
  subdomain: z.string().trim().optional(),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const JwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  phone: z.string(),
  role: RoleEnum,
  instituteId: z.string().uuid(),
  iat: z.number().optional(),
  exp: z.number().optional(),
})
export type JwtPayload = z.infer<typeof JwtPayloadSchema>

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  instituteId: z.string().uuid(),
  role: RoleEnum,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string(),
  nationalCode: z.string().nullable().optional(),
  isActive: z.boolean(),
  currentAllowedCourseId: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type AuthUser = z.infer<typeof AuthUserSchema>

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: AuthUserSchema,
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
  newPassword: z.string().min(6, "رمز عبور جدید باید حداقل ۶ کاراکتر باشد"),
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

// ---------------------------------------------------------------------------
// User Management Schemas
// ---------------------------------------------------------------------------
export const CreateUserSchema = z.object({
  firstName: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد"),
  lastName: z.string().trim().min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد"),
  phone: z
    .string()
    .trim()
    .regex(PhoneRegex, "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد").optional(),
  role: RoleEnum.default("STUDENT"),
  nationalCode: z.string().trim().optional().nullable(),
  currentAllowedCourseId: z.string().uuid().optional().nullable(),
  instituteId: z.string().uuid().optional(),
})
export type CreateUserInput = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  phone: z.string().trim().regex(PhoneRegex).optional(),
  nationalCode: z.string().trim().optional().nullable(),
  isActive: z.boolean().optional(),
  currentAllowedCourseId: z.string().uuid().optional().nullable(),
})
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

// ---------------------------------------------------------------------------
// Institute Schemas
// ---------------------------------------------------------------------------
export const InstituteSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subdomain: z.string(),
  isActive: z.boolean(),
  bankCardNumber: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  bankShaba: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type Institute = z.infer<typeof InstituteSchema>
