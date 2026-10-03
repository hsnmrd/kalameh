import { createZodDto } from 'nestjs-zod';
import { CreateStudentSchema } from '@workspace/types';

export class CreateStudentDto extends createZodDto(CreateStudentSchema) {}
