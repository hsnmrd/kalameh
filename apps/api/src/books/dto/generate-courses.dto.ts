import { createZodDto } from 'nestjs-zod';
import { GenerateCoursesFromBookSchema } from '@workspace/types';

export class GenerateCoursesFromBookDto extends createZodDto(
  GenerateCoursesFromBookSchema,
) {}
