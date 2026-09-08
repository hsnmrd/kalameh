import { createZodDto } from 'nestjs-zod';
import { ClassRequirementInputSchema } from '@workspace/types';

export class CreateClassRequirementDto extends createZodDto(
  ClassRequirementInputSchema,
) {}
