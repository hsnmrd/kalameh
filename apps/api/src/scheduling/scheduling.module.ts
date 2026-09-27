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
import { SchedulingPlanPublicationService } from './scheduling-plan-publication.service';
import { SchedulingPlanQueryService } from './scheduling-plan-query.service';
import { SchedulingPlanTeacherCalendarService } from './scheduling-plan-teacher-calendar.service';
import { SchedulingNewTeacherHiringPlanService } from './scheduling-new-teacher-hiring-plan.service';
import { SchedulingNewTeacherArrangementService } from './scheduling-new-teacher-arrangement.service';
import { SchedulingNewTeacherScheduleOptimizerService } from './scheduling-new-teacher-schedule-optimizer.service';
import { SchedulingNewTeacherPreferenceService } from './scheduling-new-teacher-preference.service';
import { SchedulingScheduleWindowService } from './scheduling-schedule-window.service';
import { SchedulingPlanReviewService } from './scheduling-plan-review.service';
import { SchedulingPlanValidationService } from './scheduling-plan-validation.service';
import { SchedulingStudentCoverageService } from './scheduling-student-coverage.service';
import { SchedulingTimeDistributionService } from './scheduling-time-distribution.service';
import { SchedulingUnresolvedRequirementService } from './scheduling-unresolved-requirement.service';
import { SchedulingRecoverySuggestionService } from './scheduling-recovery-suggestion.service';
import { SchedulingRecoveryOptionBuilderService } from './scheduling-recovery-option-builder.service';
import { SchedulingTeacherCalendarService } from './scheduling-teacher-calendar.service';
import { SchedulingTeacherAvailabilityExpansionService } from './scheduling-teacher-availability-expansion.service';
import { SchedulingTeacherReassignmentChainService } from './scheduling-teacher-reassignment-chain.service';
import { SchedulingTeacherReassignmentValidatorService } from './scheduling-teacher-reassignment-validator.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingRunQueryService } from './scheduling-run-query.service';
import { SchedulingRunsController } from './scheduling-runs.controller';
import { SchedulingDemandController } from './scheduling-demand.controller';
import { SchedulingDemandService } from './scheduling-demand.service';
import { SchedulingDemandCalculationService } from './scheduling-demand-calculation.service';
import { SchedulingDemandApplicationService } from './scheduling-demand-application.service';
import { SchedulingTermsController } from './scheduling-terms.controller';
import { SchedulingTermsService } from './scheduling-terms.service';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [
    SchedulingController,
    SchedulingRunsController,
    SchedulingDemandController,
    SchedulingTermsController,
  ],
  providers: [
    SchedulingService,
    SchedulingTermsService,
    SchedulingDemandService,
    SchedulingDemandCalculationService,
    SchedulingDemandApplicationService,
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
    SchedulingPlanPublicationService,
    SchedulingPlanQueryService,
    SchedulingPlanTeacherCalendarService,
    SchedulingNewTeacherHiringPlanService,
    SchedulingNewTeacherArrangementService,
    SchedulingNewTeacherScheduleOptimizerService,
    SchedulingNewTeacherPreferenceService,
    SchedulingScheduleWindowService,
    SchedulingPlanReviewService,
    SchedulingPlanValidationService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
    SchedulingUnresolvedRequirementService,
    SchedulingRecoverySuggestionService,
    SchedulingRecoveryOptionBuilderService,
    SchedulingTeacherCalendarService,
    SchedulingTeacherAvailabilityExpansionService,
    SchedulingTeacherReassignmentChainService,
    SchedulingTeacherReassignmentValidatorService,
  ],
  exports: [
    SchedulingService,
    SchedulingDemandService,
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
    SchedulingPlanPublicationService,
    SchedulingPlanQueryService,
    SchedulingPlanTeacherCalendarService,
    SchedulingNewTeacherHiringPlanService,
    SchedulingNewTeacherScheduleOptimizerService,
    SchedulingScheduleWindowService,
    SchedulingPlanReviewService,
    SchedulingPlanValidationService,
    SchedulingStudentCoverageService,
    SchedulingTimeDistributionService,
    SchedulingUnresolvedRequirementService,
    SchedulingRecoverySuggestionService,
    SchedulingRecoveryOptionBuilderService,
    SchedulingTeacherCalendarService,
    SchedulingTeacherAvailabilityExpansionService,
    SchedulingTeacherReassignmentChainService,
    SchedulingTeacherReassignmentValidatorService,
  ],
})
export class SchedulingModule {}
