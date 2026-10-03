import { createZodDto } from 'nestjs-zod';
import { UpdateBranchSchema } from '@workspace/types';

export class UpdateBranchDto extends createZodDto(UpdateBranchSchema) {}
