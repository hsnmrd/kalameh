import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const PreviewSlotsSchema = z.object({
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  slotDurationMinutes: z.coerce.number().int().min(15).max(240).default(90),
  hasBreak: z
    .preprocess((val) => val === 'true' || val === true, z.boolean())
    .optional(),
  breakStartTime: z.string().regex(timeRegex).optional(),
  breakEndTime: z.string().regex(timeRegex).optional(),
});

export class PreviewSlotsDto extends createZodDto(PreviewSlotsSchema) {}
