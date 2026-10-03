import { createZodDto } from 'nestjs-zod';
import { ClassFilterSchema } from '@workspace/types';

export class ClassFilterDto extends createZodDto(ClassFilterSchema) {}
