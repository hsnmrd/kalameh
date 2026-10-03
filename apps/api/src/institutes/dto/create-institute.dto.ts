import { createZodDto } from 'nestjs-zod';
import { CreateInstituteSchema } from '@workspace/types';

export class CreateInstituteDto extends createZodDto(CreateInstituteSchema) {}
