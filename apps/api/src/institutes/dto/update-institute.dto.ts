import { createZodDto } from 'nestjs-zod';
import { UpdateInstituteSchema } from '@workspace/types';

export class UpdateInstituteDto extends createZodDto(UpdateInstituteSchema) {}
