import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingCandidateSlotService } from './scheduling-candidate-slot.service';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
  ],
  exports: [
    SchedulingService,
    SchedulingPreflightService,
    SchedulingCandidateSlotService,
  ],
})
export class SchedulingModule {}
