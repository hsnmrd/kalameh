import { z } from "zod"
import { ROLES } from "./roles.constant.js"

export const RoleEnum = z.enum([
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.ASSISTANT,
  ROLES.SUPERVISOR,
  ROLES.SUPER_CLERK,
  ROLES.CLERK,
  ROLES.TEACHER,
  ROLES.SUPER_STUDENT,
  ROLES.STUDENT,
])
