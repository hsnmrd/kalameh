import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingAlternativePlanService } from './scheduling-alternative-plan.service';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingDeterministicRankingService } from './scheduling-deterministic-ranking.service';
import { SchedulingGenerationEngineService } from './scheduling-generation-engine.service';
import { SchedulingGenerationDispatcherService } from './scheduling-generation-dispatcher.service';
import { SchedulingHardConstraintService } from './scheduling-hard-constraint.service';
import { SchedulingPlanCompositionService } from './scheduling-plan-composition.service';
import { SchedulingPlanPersistenceService } from './scheduling-plan-persistence.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';
import { SchedulingUnresolvedRequirementService } from './scheduling-unresolved-requirement.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingRunQueryService } from './scheduling-run-query.service';
import { SchedulingRunsController } from './scheduling-runs.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController, SchedulingRunsController],
  providers: [
    SchedulingService,
    SchedulingAlternativePlanService,
    SchedulingPreflightService,
    SchedulingRunQueryService,
    SchedulingCandidateSlotService,
    SchedulingDeterministicRankingService,
    SchedulingGenerationEngineService,
    SchedulingGenerationDispatcherService,
    SchedulingHardConstraintService,
    SchedulingPlanCompositionService,
    SchedulingPlanPersistenceService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
    SchedulingUnresolvedRequirementService,
  ],
  exports: [
    SchedulingService,
    SchedulingAlternativePlanService,
    SchedulingPreflightService,
    SchedulingRunQueryService,
    SchedulingCandidateSlotService,
    SchedulingDeterministicRankingService,
    SchedulingGenerationEngineService,
    SchedulingGenerationDispatcherService,
    SchedulingHardConstraintService,
    SchedulingPlanCompositionService,
    SchedulingPlanPersistenceService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
    SchedulingUnresolvedRequirementService,
  ],
})
export class SchedulingModule {}
