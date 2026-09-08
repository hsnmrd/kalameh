import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentTimeProfilesService } from './student-time-profiles.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, StudentTimeProfilesService],
  exports: [StudentsService, StudentTimeProfilesService],
})
export class StudentsModule {}
