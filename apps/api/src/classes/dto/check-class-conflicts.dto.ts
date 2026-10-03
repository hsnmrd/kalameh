import { createZodDto } from 'nestjs-zod';
import { CheckClassConflictsSchema } from '@workspace/types';

export class CheckClassConflictsDto extends createZodDto(
  CheckClassConflictsSchema,
) {}
