import { createZodDto } from 'nestjs-zod';
import { ApplyTermDemandInputSchema } from '@workspace/types';

export class ApplyTermDemandDto extends createZodDto(
  ApplyTermDemandInputSchema,
) {}
