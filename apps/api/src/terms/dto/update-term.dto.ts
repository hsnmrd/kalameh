import { createZodDto } from 'nestjs-zod';
import { UpdateTermSchema } from '@workspace/types';

export class UpdateTermDto extends createZodDto(UpdateTermSchema) {}
