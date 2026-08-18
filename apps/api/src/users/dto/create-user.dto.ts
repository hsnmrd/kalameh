import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from '@workspace/types';

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
