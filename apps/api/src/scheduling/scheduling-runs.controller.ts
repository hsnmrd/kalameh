import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  APP_MODULES,
  PERMISSIONS,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentLocale } from '../i18n';
import { SchedulingRunQueryDto } from './dto/scheduling-run-query.dto';
import { SchedulingRunQueryService } from './scheduling-run-query.service';

@Controller('scheduling/runs')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class SchedulingRunsController {
  constructor(
    private readonly schedulingRunQueryService: SchedulingRunQueryService,
  ) {}

  @Get(':runId')
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  findStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Param('runId') runId: string,
    @Query() query: SchedulingRunQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.schedulingRunQueryService.findStatus(
      currentUser,
      runId,
      query.instituteId,
      locale,
    );
  }
}
