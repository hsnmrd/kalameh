import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import { PreviewTermScheduleDto } from './dto/preview-term-schedule.dto';
import { BatchCreatePhaseTermsDto } from './dto/batch-create-phase-terms.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  PERMISSIONS,
  APP_MODULES,
  parseStatusFilter,
  type JwtPayload,
  type SupportedLocale,
  type WeekDay,
} from '@workspace/types';

@Controller('terms')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_TERMS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('operatingPhaseId') operatingPhaseId?: string,
    @Query('status') status?: string,
  ) {
    const parsedIsActive = parseStatusFilter(isActive);
    return this.termsService.findAll(
      currentUser,
      targetInstituteId,
      search,
      parsedIsActive,
      operatingPhaseId,
      status,
    );
  }

  @Post('preview-schedule')
  @RequirePermissions(PERMISSIONS.VIEW_TERMS)
  previewSchedule(@Body() dto: PreviewTermScheduleDto) {
    return this.termsService.previewSchedule(dto);
  }

  @Get('preview-phase')
  @RequirePermissions(PERMISSIONS.VIEW_TERMS)
  async previewPhaseTerms(
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
    @Query('operatingPhaseId') operatingPhaseId: string,
    @Query('jalaliYear') jalaliYear: string,
    @Query('daysPerTerm') daysPerTerm?: string,
    @Query('sessionsPerTerm') sessionsPerTerm?: string,
    @Query('daysOfWeek') daysOfWeek?: string,
    @Query('classPatterns') classPatterns?: string,
    @Query('gapDays') gapDays?: string,
  ) {
    const parsedDays = daysOfWeek
      ? (daysOfWeek.split(',').map((d) => d.trim()) as WeekDay[])
      : undefined;
    let parsedPatterns: WeekDay[][] | undefined;
    if (classPatterns) {
      try {
        parsedPatterns = JSON.parse(classPatterns) as WeekDay[][];
      } catch {
        // ignore invalid json
      }
    }
    const sessionCount = Number(sessionsPerTerm) || Number(daysPerTerm) || 18;
    return this.termsService.previewPhaseTerms(
      currentUser,
      operatingPhaseId,
      Number(jalaliYear) || 1403,
      sessionCount,
      parsedDays,
      parsedPatterns,
      gapDays ? Number(gapDays) : undefined,
      locale,
    );
  }

  @Post('batch-phase')
  @RequirePermissions(PERMISSIONS.MANAGE_TERMS)
  async batchCreatePhaseTerms(
    @Body() dto: BatchCreatePhaseTermsDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.batchCreatePhaseTerms(dto, currentUser, locale);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_TERMS)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_TERMS)
  async create(
    @Body() dto: CreateTermDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_TERMS)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTermDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.update(id, dto, currentUser, locale);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_TERMS)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.remove(id, currentUser, locale);
  }
}
