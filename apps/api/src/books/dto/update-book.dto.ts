import { createZodDto } from 'nestjs-zod';
import { UpdateBookSchema } from '@workspace/types';

export class UpdateBookDto extends createZodDto(UpdateBookSchema) {}
