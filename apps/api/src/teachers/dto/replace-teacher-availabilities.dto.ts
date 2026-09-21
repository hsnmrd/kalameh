import { createZodDto } from 'nestjs-zod';
import { ReplaceTeacherAvailabilitiesSchema } from '@workspace/types';

export class ReplaceTeacherAvailabilitiesDto extends createZodDto(
  ReplaceTeacherAvailabilitiesSchema,
) {}
