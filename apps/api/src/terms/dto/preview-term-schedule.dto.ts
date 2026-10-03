import { createZodDto } from 'nestjs-zod';
import { PreviewTermScheduleSchema } from '@workspace/types';

export class PreviewTermScheduleDto extends createZodDto(
  PreviewTermScheduleSchema,
) {}
