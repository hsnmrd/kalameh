import { Injectable } from '@nestjs/common';
import {
  type ApplyTermDemandInput,
  type ApplyTermDemandResult,
  type CalculateTermDemandInput,
  type JwtPayload,
  type TermDemandReportDto,
} from '@workspace/types';
import { SchedulingDemandApplicationService } from './scheduling-demand-application.service';
import { SchedulingDemandCalculationService } from './scheduling-demand-calculation.service';

@Injectable()
export class SchedulingDemandService {
  constructor(
    private readonly calculationService: SchedulingDemandCalculationService,
    private readonly applicationService: SchedulingDemandApplicationService,
  ) {}

  calculateDemand(
    currentUser: JwtPayload,
    input: CalculateTermDemandInput,
  ): Promise<TermDemandReportDto> {
    return this.calculationService.calculateDemand(currentUser, input);
  }

  applyDemand(
    currentUser: JwtPayload,
    input: ApplyTermDemandInput,
  ): Promise<ApplyTermDemandResult> {
    return this.applicationService.applyDemand(currentUser, input);
  }
}
