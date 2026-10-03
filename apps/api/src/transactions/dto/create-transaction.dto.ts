import { createZodDto } from 'nestjs-zod';
import { CreateTransactionSchema } from '@workspace/types';

export class CreateTransactionDto extends createZodDto(
  CreateTransactionSchema,
) {}
