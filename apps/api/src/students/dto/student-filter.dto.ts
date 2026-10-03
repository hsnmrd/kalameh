import { createZodDto } from 'nestjs-zod';
import { StudentFilterSchema } from '@workspace/types';

export class StudentFilterDto extends createZodDto(StudentFilterSchema) {}
