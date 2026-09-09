import { createZodDto } from 'nestjs-zod';
import { UpdateSchedulingProposalSchema } from '@workspace/types';

export class UpdateSchedulingProposalDto extends createZodDto(
  UpdateSchedulingProposalSchema,
) {}
