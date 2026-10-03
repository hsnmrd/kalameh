import { createZodDto } from 'nestjs-zod';
import { UpdateClassSchema } from '@workspace/types';

export class UpdateClassDto extends createZodDto(UpdateClassSchema) {}
