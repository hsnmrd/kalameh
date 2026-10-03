import { createZodDto } from 'nestjs-zod';
import { UpdateClassRequirementSchema } from '@workspace/types';

export class UpdateClassRequirementDto extends createZodDto(
  UpdateClassRequirementSchema,
) {}
