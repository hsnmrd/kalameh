import { createZodDto } from 'nestjs-zod';
import { SchedulingRunQuerySchema } from '@workspace/types';

export class SchedulingRunQueryDto extends createZodDto(
  SchedulingRunQuerySchema,
) {}
