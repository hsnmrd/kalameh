import { z } from "zod"

export const APP_MODULES = {
  USERS_STAFF: "USERS_STAFF",
  STUDENTS: "STUDENTS",
  CLASSES_COURSES: "CLASSES_COURSES",
  GRADES_ASSESSMENTS: "GRADES_ASSESSMENTS",
  FINANCE: "FINANCE",
  ATTENDANCE: "ATTENDANCE",
  SMS_NOTIFICATIONS: "SMS_NOTIFICATIONS",
  ONLINE_ROOMS: "ONLINE_ROOMS",
} as const

export type AppModule = (typeof APP_MODULES)[keyof typeof APP_MODULES]

export const ALL_APP_MODULES: readonly AppModule[] = [
  APP_MODULES.USERS_STAFF,
  APP_MODULES.STUDENTS,
  APP_MODULES.CLASSES_COURSES,
  APP_MODULES.GRADES_ASSESSMENTS,
  APP_MODULES.FINANCE,
  APP_MODULES.ATTENDANCE,
  APP_MODULES.SMS_NOTIFICATIONS,
  APP_MODULES.ONLINE_ROOMS,
]

export const DEFAULT_ENABLED_MODULES: readonly AppModule[] = [
  APP_MODULES.USERS_STAFF,
  APP_MODULES.STUDENTS,
  APP_MODULES.CLASSES_COURSES,
]

export const InstituteSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subdomain: z.string(),
  isActive: z.boolean(),
  enabledModules: z.array(z.string()).default([...DEFAULT_ENABLED_MODULES]),
  logoUrl: z.string().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phones: z.array(z.string()).default([]),
  bankCardNumber: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  bankShaba: z.string().nullable().optional(),
  deletedAt: z.date().or(z.string()).nullable().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
})
export type Institute = z.infer<typeof InstituteSchema>

export const InstituteWithStatsSchema = InstituteSchema.extend({
  classesCount: z.number().default(0),
  usersCount: z.number().default(0),
})
export type InstituteWithStats = z.infer<typeof InstituteWithStatsSchema>

export const createCreateInstituteSchema = (msg?: {
  nameMin?: string
  subdomainMin?: string
  subdomainRegex?: string
  primaryColorRegex?: string
}) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, msg?.nameMin ? { message: msg.nameMin } : undefined),
    subdomain: z
      .string()
      .trim()
      .min(2, msg?.subdomainMin ? { message: msg.subdomainMin } : undefined)
      .regex(
        /^[a-z0-9-]+$/,
        msg?.subdomainRegex
          ? { message: msg.subdomainRegex }
          : {
              message:
                "Subdomain must contain only lowercase letters, numbers, and dashes",
            }
      ),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      }, z.boolean())
      .default(true),
    enabledModules: z
      .preprocess((val) => {
        if (Array.isArray(val)) return val.filter(Boolean)
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val)
            if (Array.isArray(parsed)) return parsed
          } catch {
            return [val]
          }
        }
        return val
      }, z.array(z.string()))
      .optional(),
    logo: z.any().optional().nullable(),
    logoUrl: z.string().trim().optional().nullable(),
    primaryColor: z
      .string()
      .trim()
      .regex(
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
        msg?.primaryColorRegex
          ? { message: msg.primaryColorRegex }
          : { message: "Invalid hex color format" }
      )
      .or(z.literal(""))
      .optional()
      .nullable(),
    address: z.string().trim().optional().nullable(),
    phones: z
      .preprocess((val) => {
        if (typeof val === "string") return val ? [val] : []
        if (Array.isArray(val)) return val.filter(Boolean)
        return []
      }, z.array(z.string().trim()))
      .optional(),
    bankCardNumber: z.string().trim().optional().nullable(),
    bankAccountName: z.string().trim().optional().nullable(),
    bankShaba: z.string().trim().optional().nullable(),
  })

export const CreateInstituteSchema = createCreateInstituteSchema()
export type CreateInstituteInput = z.infer<typeof CreateInstituteSchema>

export const createUpdateInstituteSchema = (msg?: {
  nameMin?: string
  subdomainMin?: string
  subdomainRegex?: string
  primaryColorRegex?: string
}) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, msg?.nameMin ? { message: msg.nameMin } : undefined)
      .optional(),
    subdomain: z
      .string()
      .trim()
      .min(2, msg?.subdomainMin ? { message: msg.subdomainMin } : undefined)
      .regex(
        /^[a-z0-9-]+$/,
        msg?.subdomainRegex
          ? { message: msg.subdomainRegex }
          : {
              message:
                "Subdomain must contain only lowercase letters, numbers, and dashes",
            }
      )
      .optional(),
    isActive: z
      .preprocess((val) => {
        if (val === "true" || val === true) return true
        if (val === "false" || val === false) return false
        return val
      }, z.boolean())
      .optional(),
    enabledModules: z
      .preprocess((val) => {
        if (Array.isArray(val)) return val.filter(Boolean)
        if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val)
            if (Array.isArray(parsed)) return parsed
          } catch {
            return [val]
          }
        }
        return val
      }, z.array(z.string()))
      .optional(),
    logo: z.any().optional().nullable(),
    logoUrl: z.string().trim().optional().nullable(),
    primaryColor: z
      .string()
      .trim()
      .regex(
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
        msg?.primaryColorRegex
          ? { message: msg.primaryColorRegex }
          : { message: "Invalid hex color format" }
      )
      .or(z.literal(""))
      .optional()
      .nullable(),
    address: z.string().trim().optional().nullable(),
    phones: z
      .preprocess((val) => {
        if (typeof val === "string") return val ? [val] : []
        if (Array.isArray(val)) return val.filter(Boolean)
        return []
      }, z.array(z.string().trim()))
      .optional(),
    bankCardNumber: z.string().trim().optional().nullable(),
    bankAccountName: z.string().trim().optional().nullable(),
    bankShaba: z.string().trim().optional().nullable(),
  })

export const UpdateInstituteSchema = createUpdateInstituteSchema()
export type UpdateInstituteInput = z.infer<typeof UpdateInstituteSchema>
