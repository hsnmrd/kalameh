import { createZodDto } from 'nestjs-zod';
import { ChangePasswordSchema } from '@workspace/types';

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
