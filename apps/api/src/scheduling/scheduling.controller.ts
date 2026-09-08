import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
import { GenerateSchedulingPlanDto } from './dto/generate-scheduling-plan.dto';
import { SchedulingService } from './scheduling.service';

@Controller('scheduling/plans')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Post('generate')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  generate(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: GenerateSchedulingPlanDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.schedulingService.generate(currentUser, dto, locale);
  }
}
