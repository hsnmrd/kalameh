import { createZodDto } from 'nestjs-zod';
import { ResetRolePermissionsSchema } from '@workspace/types';

export class ResetRolePermissionsDto extends createZodDto(
  ResetRolePermissionsSchema,
) {}
