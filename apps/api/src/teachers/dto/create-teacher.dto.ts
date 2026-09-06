import { createZodDto } from 'nestjs-zod';
import { CreateTeacherSchema } from '@workspace/types';

export class CreateTeacherDto extends createZodDto(CreateTeacherSchema) {}
