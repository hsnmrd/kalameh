import { createZodDto } from 'nestjs-zod';
import { PromoteWaitlistSchema } from '@workspace/types';

export class PromoteWaitlistDto extends createZodDto(PromoteWaitlistSchema) {}
