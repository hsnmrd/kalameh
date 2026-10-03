import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { APP_MODULES, PERMISSIONS, type JwtPayload } from '@workspace/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ApplyTermDemandDto } from './dto/apply-term-demand.dto';
import { CalculateTermDemandDto } from './dto/calculate-term-demand.dto';
import { SchedulingDemandService } from './scheduling-demand.service';

@Controller('scheduling/demand')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class SchedulingDemandController {
  constructor(
    private readonly schedulingDemandService: SchedulingDemandService,
  ) {}

  @Post('calculate')
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  calculate(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CalculateTermDemandDto,
  ) {
    return this.schedulingDemandService.calculateDemand(currentUser, dto);
  }

  @Post('apply')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  apply(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: ApplyTermDemandDto,
  ) {
    return this.schedulingDemandService.applyDemand(currentUser, dto);
  }
}
