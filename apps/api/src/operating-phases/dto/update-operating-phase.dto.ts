import { createZodDto } from 'nestjs-zod';
import { UpdateOperatingPhaseSchema } from '@workspace/types';

export class UpdateOperatingPhaseDto extends createZodDto(
  UpdateOperatingPhaseSchema,
) {}
