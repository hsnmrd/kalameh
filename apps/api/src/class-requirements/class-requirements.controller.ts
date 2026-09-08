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
import { ClassRequirementsService } from './class-requirements.service';
import { ClassRequirementFilterDto } from './dto/class-requirement-filter.dto';
import { CreateClassRequirementDto } from './dto/create-class-requirement.dto';
import { UpdateClassRequirementDto } from './dto/update-class-requirement.dto';

@Controller('class-requirements')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class ClassRequirementsController {
  constructor(
    private readonly classRequirementsService: ClassRequirementsService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() filter: ClassRequirementFilterDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classRequirementsService.findAll(currentUser, filter, locale);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Query() filter: ClassRequirementFilterDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classRequirementsService.findOne(
      currentUser,
      id,
      filter.instituteId,
      locale,
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateClassRequirementDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classRequirementsService.create(currentUser, dto, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Query() filter: ClassRequirementFilterDto,
    @Body() dto: UpdateClassRequirementDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classRequirementsService.update(
      currentUser,
      id,
      dto,
      filter.instituteId,
      locale,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  deactivate(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Query() filter: ClassRequirementFilterDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classRequirementsService.deactivate(
      currentUser,
      id,
      filter.instituteId,
      locale,
    );
  }
}
