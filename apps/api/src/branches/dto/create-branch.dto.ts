import { createZodDto } from 'nestjs-zod';
import { CreateBranchSchema } from '@workspace/types';

export class CreateBranchDto extends createZodDto(CreateBranchSchema) {}
