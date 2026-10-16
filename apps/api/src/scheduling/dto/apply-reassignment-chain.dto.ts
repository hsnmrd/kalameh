import { createZodDto } from 'nestjs-zod';
import { ApplyTeacherReassignmentChainInputSchema } from '@workspace/types';

export class ApplyTeacherReassignmentChainDto extends createZodDto(
  ApplyTeacherReassignmentChainInputSchema,
) {}
