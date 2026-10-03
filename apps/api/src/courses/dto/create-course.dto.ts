import { createZodDto } from 'nestjs-zod';
import { CreateCourseSchema } from '@workspace/types';

export class CreateCourseDto extends createZodDto(CreateCourseSchema) {}
