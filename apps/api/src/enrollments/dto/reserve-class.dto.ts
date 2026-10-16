import { createZodDto } from 'nestjs-zod';
import { ReserveClassSchema } from '@workspace/types';

export class ReserveClassDto extends createZodDto(ReserveClassSchema) {}
