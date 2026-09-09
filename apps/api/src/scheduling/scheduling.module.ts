import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';
import { SchedulingUnresolvedRequirementService } from './scheduling-unresolved-requirement.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
    SchedulingDeterministicRankingService,
    SchedulingHardConstraintService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
    SchedulingUnresolvedRequirementService,
  ],
  exports: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
    SchedulingDeterministicRankingService,
    SchedulingHardConstraintService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
    SchedulingUnresolvedRequirementService,
  ],
})
export class SchedulingModule {}
