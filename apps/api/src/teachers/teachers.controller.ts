import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { ReplaceTeacherCoursesDto } from './dto/replace-teacher-courses.dto';
import { ReplaceTeacherAvailabilitiesDto } from './dto/replace-teacher-availabilities.dto';
import { TeacherCourseQualificationsQueryDto } from './dto/teacher-course-qualifications-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import { imageUploadOptions } from '../common/upload/multer.util';
import {
  PERMISSIONS,
  parseStatusFilter,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('teachers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_TEACHERS)
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions('avatars')))
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateTeacherDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.create(currentUser, dto, locale, file);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_TEACHERS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('instituteId') instituteId?: string,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    const parsedIsActive = parseStatusFilter(isActive);

    return this.teachersService.findAll(
      currentUser,
      {
        search,
        isActive: parsedIsActive,
        instituteId,
      },
      locale,
    );
  }

  @Get('lookup')
  @RequirePermissions(PERMISSIONS.VIEW_TEACHERS)
  async lookup(
    @CurrentUser() currentUser: JwtPayload,
    @Query('nationalCode') nationalCode?: string,
    @Query('phone') phone?: string,
  ) {
    return this.teachersService.lookup(currentUser, nationalCode, phone);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_TEACHERS)
  async findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.findOne(currentUser, id, locale);
  }

  @Get(':id/course-qualifications')
  @RequirePermissions(PERMISSIONS.VIEW_TEACHERS)
  async findCourseQualifications(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Query() query: TeacherCourseQualificationsQueryDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.findCourseQualifications(
      currentUser,
      id,
      query.instituteId,
      locale,
    );
  }

  @Put(':id/course-qualifications')
  @RequirePermissions(PERMISSIONS.MANAGE_TEACHERS)
  async replaceCourseQualifications(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Query() query: TeacherCourseQualificationsQueryDto,
    @Body() dto: ReplaceTeacherCoursesDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.replaceCourseQualifications(
      currentUser,
      id,
      dto,
      query.instituteId,
      locale,
    );
  }

  @Put(':id/availabilities')
  @RequirePermissions(PERMISSIONS.MANAGE_TEACHERS)
  async replaceAvailabilities(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplaceTeacherAvailabilitiesDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.replaceAvailabilities(
      currentUser,
      id,
      dto,
      locale,
    );
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_TEACHERS)
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions('avatars')))
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.update(currentUser, id, dto, locale, file);
  }

  @Post(':id/reset-password')
  @RequirePermissions(PERMISSIONS.MANAGE_TEACHERS)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body('password') password?: string,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ) {
    return this.teachersService.resetPassword(
      currentUser,
      id,
      password,
      locale,
    );
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_TEACHERS)
  async remove(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.teachersService.remove(currentUser, id, locale);
  }
}
