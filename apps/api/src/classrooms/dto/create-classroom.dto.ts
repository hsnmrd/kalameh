import { createZodDto } from 'nestjs-zod';
import { CreateClassroomSchema } from '@workspace/types';

export class CreateClassroomDto extends createZodDto(CreateClassroomSchema) {}
