import { createZodDto } from 'nestjs-zod';
import { LoginInputSchema } from '@workspace/types';

export class LoginDto extends createZodDto(LoginInputSchema) {}
