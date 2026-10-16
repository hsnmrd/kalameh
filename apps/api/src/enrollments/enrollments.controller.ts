import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { ReserveClassDto } from './dto/reserve-class.dto';
import { WaitlistClassDto } from './dto/waitlist-class.dto';
import { PromoteWaitlistDto } from './dto/promote-waitlist.dto';
import { EnrollmentFilterDto } from './dto/enrollment-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  APP_MODULES,
  PERMISSIONS,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('reserve')
  @RequirePermissions(PERMISSIONS.ENROLL_SELF)
  reserve(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: ReserveClassDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.enrollmentsService.reserve(currentUser, dto, locale);
  }

  @Delete('reserve/:classId')
  @RequirePermissions(PERMISSIONS.ENROLL_SELF)
  cancelReservation(
    @CurrentUser() currentUser: JwtPayload,
    @Param('classId') classId: string,
  ) {
    return this.enrollmentsService.cancelReservation(currentUser, classId);
  }

  @Post('waitlist')
  @RequirePermissions(PERMISSIONS.ENROLL_SELF)
  joinWaitlist(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: WaitlistClassDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.enrollmentsService.joinWaitlist(currentUser, dto, locale);
  }

  @Get('my')
  @RequirePermissions(PERMISSIONS.VIEW_OWN_ENROLLMENTS)
  getMyEnrollments(@CurrentUser() currentUser: JwtPayload) {
    return this.enrollmentsService.getMyEnrollments(currentUser);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_ENROLLMENTS)
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() filter: EnrollmentFilterDto,
  ) {
    return this.enrollmentsService.findAll(currentUser, filter);
  }

  @Patch(':id/promote')
  @RequirePermissions(PERMISSIONS.MANAGE_ENROLLMENTS)
  promoteWaitlist(
    @Param('id') id: string,
    @Body() dto: PromoteWaitlistDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.enrollmentsService.promoteWaitlist(currentUser, id, dto);
  }
}
