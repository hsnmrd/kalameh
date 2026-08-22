import { createZodDto } from 'nestjs-zod';
import { UpdateStudentSchema } from '@workspace/types';

export class UpdateStudentDto extends createZodDto(UpdateStudentSchema) {}
