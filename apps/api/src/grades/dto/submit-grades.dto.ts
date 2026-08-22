import { createZodDto } from 'nestjs-zod';
import { SubmitFinalGradesSchema } from '@workspace/types';

export class SubmitFinalGradesDto extends createZodDto(
  SubmitFinalGradesSchema,
) {}
