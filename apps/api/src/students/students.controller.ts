import {
  Controller,
  Get,
  Post,
  Patch,
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
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AddStudentNoteDto } from './dto/add-student-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import { imageUploadOptions } from '../common/upload/multer.util';
import {
  PERMISSIONS,
  APP_MODULES,
  parseStatusFilter,
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
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions('avatars')))
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateStudentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.create(currentUser, dto, locale, file);
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
    const parsedIsActive = parseStatusFilter(isActive);

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

  @Get('lookup')
  @RequirePermissions(PERMISSIONS.VIEW_STUDENTS)
  async lookup(
    @CurrentUser() currentUser: JwtPayload,
    @Query('nationalCode') nationalCode?: string,
    @Query('phone') phone?: string,
  ) {
    return this.studentsService.lookup(currentUser, nationalCode, phone);
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
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions('avatars')))
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.update(currentUser, id, dto, locale, file);
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

  @Post(':id/notes')
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENT_NOTES)
  async addNote(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddStudentNoteDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.addNote(currentUser, id, dto, locale);
  }
}
