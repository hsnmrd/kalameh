import { createZodDto } from 'nestjs-zod';
import { EnrollmentFilterSchema } from '@workspace/types';

export class EnrollmentFilterDto extends createZodDto(EnrollmentFilterSchema) {}
