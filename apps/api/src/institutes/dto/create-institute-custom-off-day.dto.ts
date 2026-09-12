import { createZodDto } from 'nestjs-zod';
import { CreateInstituteCustomOffDaySchema } from '@workspace/types';

export class CreateInstituteCustomOffDayDto extends createZodDto(
  CreateInstituteCustomOffDaySchema,
) {}
