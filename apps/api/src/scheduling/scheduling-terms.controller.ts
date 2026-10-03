import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  APP_MODULES,
  PERMISSIONS,
  type JwtPayload,
  type SchedulingTermSummaryDto,
  type SupportedLocale,
} from '@workspace/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CurrentLocale } from '../i18n';
import { SchedulingTermsService } from './scheduling-terms.service';

@Controller('scheduling/terms')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class SchedulingTermsController {
  constructor(
    private readonly schedulingTermsService: SchedulingTermsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  getTermsSummary(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') instituteId?: string,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<SchedulingTermSummaryDto[]> {
    return this.schedulingTermsService.getTermsSummary(
      currentUser,
      instituteId,
      locale,
    );
  }
}
