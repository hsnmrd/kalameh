import { z } from "zod"
import { RoleEnum, type Role } from "../roles/index.js"

export const UserImportRowSchema = z.object({
  firstName: z.string().min(2, "نام باید حداقل ۲ کاراکتر باشد").max(50),
  lastName: z.string().min(2, "نام خانوادگی باید حداقل ۲ کاراکتر باشد").max(50),
  phone: z
    .string()
    .regex(/^09\d{9}$/, "شماره موبایل باید ۱۱ رقم بوده و با ۰۹ شروع شود"),
  nationalCode: z
    .string()
    .regex(/^\d{10}$/, "کد ملی باید دقیقاً ۱۰ رقم باشد")
    .optional()
    .nullable(),
  role: RoleEnum.default("TEACHER"),
  branchName: z.string().optional().nullable(),
  password: z
    .string()
    .min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد")
    .optional()
    .nullable(),
})

export type UserImportRow = z.infer<typeof UserImportRowSchema>

export interface ExcelImportError {
  row: number
  phone?: string
  message: string
}

export interface ExcelImportResult {
  totalRows: number
  importedCount: number
  failedCount: number
  errors: ExcelImportError[]
}
