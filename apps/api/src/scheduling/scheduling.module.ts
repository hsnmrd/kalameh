import { Module } from '@nestjs/common';
import { SchedulingController } from './scheduling.controller';
import { SchedulingPreflightService } from './scheduling-preflight.service';
import { SchedulingService } from './scheduling.service';

@Module({
  controllers: [SchedulingController],
  providers: [SchedulingService, SchedulingPreflightService],
  exports: [SchedulingService, SchedulingPreflightService],
})
export class SchedulingModule {}
