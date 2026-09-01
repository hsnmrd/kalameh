import { createZodDto } from 'nestjs-zod';
import { UpdateClassroomSchema } from '@workspace/types';

export class UpdateClassroomDto extends createZodDto(UpdateClassroomSchema) {}
