import { createZodDto } from 'nestjs-zod';
import { UpdateRolePermissionsSchema } from '@workspace/types';

export class UpdateRolePermissionsDto extends createZodDto(
  UpdateRolePermissionsSchema,
) {}
