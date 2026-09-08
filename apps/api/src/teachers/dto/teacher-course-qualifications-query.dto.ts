import { createZodDto } from 'nestjs-zod';
import { TeacherCourseQualificationsQuerySchema } from '@workspace/types';

export class TeacherCourseQualificationsQueryDto extends createZodDto(
  TeacherCourseQualificationsQuerySchema,
) {}
