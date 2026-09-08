import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
    SchedulingHardConstraintService,
    SchedulingStudentCoverageService,
  ],
  exports: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
    SchedulingHardConstraintService,
    SchedulingStudentCoverageService,
  ],
})
export class SchedulingModule {}
