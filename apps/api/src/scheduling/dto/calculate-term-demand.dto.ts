import { createZodDto } from 'nestjs-zod';
import { CalculateTermDemandInputSchema } from '@workspace/types';

export class CalculateTermDemandDto extends createZodDto(
  CalculateTermDemandInputSchema,
) {}
