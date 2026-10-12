import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentAvailabilityService } from './student-availability.service';
import { StudentExcelService } from './student-excel.service';
import { StudentImportAvailabilityService } from './student-import-availability.service';

@Module({
  controllers: [StudentsController],
  providers: [
    StudentsService,
    StudentAvailabilityService,
    StudentExcelService,
    StudentImportAvailabilityService,
  ],
  exports: [
    StudentsService,
    StudentAvailabilityService,
    StudentExcelService,
    StudentImportAvailabilityService,
  ],
})
export class StudentsModule {}
