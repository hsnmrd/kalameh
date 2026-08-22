import { createZodDto } from 'nestjs-zod';
import { CreateTermSchema } from '@workspace/types';

export class CreateTermDto extends createZodDto(CreateTermSchema) {}
