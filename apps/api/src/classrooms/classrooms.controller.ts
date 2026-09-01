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
import { ClassroomsService } from './classrooms.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
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
} from '@workspace/types';

@Controller('classrooms')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class ClassroomsController {
  constructor(private readonly classroomsService: ClassroomsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_CLASSROOMS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
    @Query('branchId') branchId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const parsedIsActive = parseStatusFilter(isActive);
    return this.classroomsService.findAll(
      currentUser,
      targetInstituteId,
      branchId,
      search,
      parsedIsActive,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_CLASSROOMS)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classroomsService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSROOMS)
  async create(
    @Body() dto: CreateClassroomDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classroomsService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSROOMS)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClassroomDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classroomsService.update(id, dto, currentUser, locale);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSROOMS)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classroomsService.remove(id, currentUser, locale);
  }
}
