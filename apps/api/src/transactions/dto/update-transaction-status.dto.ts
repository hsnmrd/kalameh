import { createZodDto } from 'nestjs-zod';
import { UpdateTransactionStatusSchema } from '@workspace/types';

export class UpdateTransactionStatusDto extends createZodDto(
  UpdateTransactionStatusSchema,
) {}
