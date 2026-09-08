import { createZodDto } from 'nestjs-zod';
import { GenerateSchedulingPlanSchema } from '@workspace/types';

export class GenerateSchedulingPlanDto extends createZodDto(
  GenerateSchedulingPlanSchema,
) {}
