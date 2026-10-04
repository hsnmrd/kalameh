import { createZodDto } from 'nestjs-zod';
import { UpdateStudentAvailabilitiesSchema } from '@workspace/types';

export class UpdateStudentAvailabilitiesDto extends createZodDto(
  UpdateStudentAvailabilitiesSchema,
) {}
