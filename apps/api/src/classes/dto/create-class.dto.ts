import { createZodDto } from 'nestjs-zod';
import { CreateClassSchema } from '@workspace/types';

export class CreateClassDto extends createZodDto(CreateClassSchema) {}
