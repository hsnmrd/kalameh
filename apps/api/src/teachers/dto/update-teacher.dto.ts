import { createZodDto } from 'nestjs-zod';
import { UpdateTeacherSchema } from '@workspace/types';

export class UpdateTeacherDto extends createZodDto(UpdateTeacherSchema) {}
