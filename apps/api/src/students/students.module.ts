import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentAvailabilityService } from './student-availability.service';
import { StudentExcelService } from './student-excel.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, StudentAvailabilityService, StudentExcelService],
  exports: [StudentsService, StudentAvailabilityService, StudentExcelService],
})
export class StudentsModule {}
