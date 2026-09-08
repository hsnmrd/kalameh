import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';
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
    SchedulingTimeDistributionService,
  ],
  exports: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
    SchedulingHardConstraintService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
  ],
})
export class SchedulingModule {}
