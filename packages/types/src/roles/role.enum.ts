import { z } from "zod"
import { ROLES } from "./roles.constant.js"

export const RoleEnum = z.enum([
  ROLES.SUPER_ADMIN,
  ROLES.INSTITUTE_ADMIN,
  ROLES.CLERK,
  ROLES.STUDENT,
])
