import { createZodDto } from 'nestjs-zod';
import { ReplaceStudentTimeProfileSchema } from '@workspace/types';

export class ReplaceStudentTimeProfileDto extends createZodDto(
  ReplaceStudentTimeProfileSchema,
) {}
