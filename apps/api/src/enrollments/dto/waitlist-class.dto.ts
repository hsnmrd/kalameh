import { createZodDto } from 'nestjs-zod';
import { WaitlistClassSchema } from '@workspace/types';

export class WaitlistClassDto extends createZodDto(WaitlistClassSchema) {}
