import { createZodDto } from 'nestjs-zod';
import { ReplaceTeacherCoursesSchema } from '@workspace/types';

export class ReplaceTeacherCoursesDto extends createZodDto(
  ReplaceTeacherCoursesSchema,
) {}
