import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentAvailabilityService } from './student-availability.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, StudentAvailabilityService],
  exports: [StudentsService, StudentAvailabilityService],
})
export class StudentsModule {}
