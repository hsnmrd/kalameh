import { createZodDto } from 'nestjs-zod';
import { TransactionFilterSchema } from '@workspace/types';

export class TransactionFilterDto extends createZodDto(
  TransactionFilterSchema,
) {}
