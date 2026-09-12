import { createZodDto } from 'nestjs-zod';
import { BatchCreatePhaseTermsSchema } from '@workspace/types';

export class BatchCreatePhaseTermsDto extends createZodDto(
  BatchCreatePhaseTermsSchema,
) {}
