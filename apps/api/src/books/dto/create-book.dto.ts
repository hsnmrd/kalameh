import { createZodDto } from 'nestjs-zod';
import { CreateBookSchema } from '@workspace/types';

export class CreateBookDto extends createZodDto(CreateBookSchema) {}
