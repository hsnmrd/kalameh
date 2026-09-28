import { createZodDto } from 'nestjs-zod';
import { CommitHiringPlanInputSchema } from '@workspace/types';

export class CommitHiringPlanDto extends createZodDto(
  CommitHiringPlanInputSchema,
) {}
