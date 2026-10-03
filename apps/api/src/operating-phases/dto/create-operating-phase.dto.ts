import { createZodDto } from 'nestjs-zod';
import { CreateOperatingPhaseSchema } from '@workspace/types';

export class CreateOperatingPhaseDto extends createZodDto(
  CreateOperatingPhaseSchema,
) {}
