import { createZodDto } from 'nestjs-zod';
import { UpdateCourseSchema } from '@workspace/types';

export class UpdateCourseDto extends createZodDto(UpdateCourseSchema) {}
