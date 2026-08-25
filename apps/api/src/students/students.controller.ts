import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
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
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.STUDENTS)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateStudentDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.create(currentUser, dto, locale);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_STUDENTS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('search') search?: string,
    @Query('courseId') courseId?: string,
    @Query('isActive') isActive?: string,
    @Query('instituteId') instituteId?: string,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    const parsedIsActive =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.studentsService.findAll(
      currentUser,
      {
        search,
        courseId,
        isActive: parsedIsActive,
        instituteId,
      },
      locale,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_STUDENTS)
  async findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.findOne(currentUser, id, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.update(currentUser, id, dto, locale);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  async resetPassword(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body('newPassword') newPassword: string | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.resetPassword(
      currentUser,
      id,
      newPassword,
      locale,
    );
  }
}
