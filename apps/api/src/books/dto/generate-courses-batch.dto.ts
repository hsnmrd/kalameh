import { createZodDto } from 'nestjs-zod';
import { BatchGenerateCoursesSchema } from '@workspace/types';

export class BatchGenerateCoursesDto extends createZodDto(
  BatchGenerateCoursesSchema,
) {}
