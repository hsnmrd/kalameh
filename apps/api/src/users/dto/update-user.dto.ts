import { createZodDto } from 'nestjs-zod';
import { UpdateUserSchema } from '@workspace/types';

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
