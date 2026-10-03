import { createZodDto } from 'nestjs-zod';
import { SetStudentLevelSchema } from '@workspace/types';

export class SetStudentLevelDto extends createZodDto(SetStudentLevelSchema) {}
