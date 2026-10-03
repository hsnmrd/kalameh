import { createZodDto } from 'nestjs-zod';
import { AuditLogFilterSchema } from '@workspace/types';

export class AuditLogFilterDto extends createZodDto(AuditLogFilterSchema) {}
