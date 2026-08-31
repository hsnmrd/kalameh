import { createZodDto } from 'nestjs-zod';
import { AddStudentNoteSchema } from '@workspace/types';

export class AddStudentNoteDto extends createZodDto(AddStudentNoteSchema) {}
