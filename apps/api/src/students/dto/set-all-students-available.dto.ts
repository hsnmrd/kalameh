import { createZodDto } from 'nestjs-zod';
import { SetAllStudentsAvailableSchema } from '@workspace/types';

export class SetAllStudentsAvailableDto extends createZodDto(
  SetAllStudentsAvailableSchema,
) {}
