import { createZodDto } from 'nestjs-zod';
import { ClassRequirementFilterSchema } from '@workspace/types';

export class ClassRequirementFilterDto extends createZodDto(
  ClassRequirementFilterSchema,
) {}
