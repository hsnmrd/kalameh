import { createZodDto } from 'nestjs-zod';
import { ToggleTeacherOutreachInputSchema } from '@workspace/types';

export class ToggleTeacherOutreachDto extends createZodDto(
  ToggleTeacherOutreachInputSchema,
) {}
