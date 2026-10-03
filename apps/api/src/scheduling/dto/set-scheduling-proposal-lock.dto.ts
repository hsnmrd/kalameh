import { createZodDto } from 'nestjs-zod';
import { SetSchedulingProposalLockSchema } from '@workspace/types';

export class SetSchedulingProposalLockDto extends createZodDto(
  SetSchedulingProposalLockSchema,
) {}
