import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service';
import { StudentAvailabilityService } from './student-availability.service';
import { StudentExcelService } from './student-excel.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UpdateStudentAvailabilitiesDto } from './dto/update-student-availabilities.dto';
import { SetAllStudentsAvailableDto } from './dto/set-all-students-available.dto';
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
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';
import { StudentFilterDto } from './dto/student-filter.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.STUDENTS)
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly studentAvailabilityService: StudentAvailabilityService,
    private readonly studentExcelService: StudentExcelService,
  ) {}

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
    @Query() filter: StudentFilterDto,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    return this.studentsService.findAll(currentUser, filter, locale);
  }

  @Get('excel-template')
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  excelTemplate(
    @Res() res: Response,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ) {
    const buffer = this.studentExcelService.generateTemplate(locale);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="students-import-template.xlsx"',
    );
    return res.send(buffer);
  }

  @Get('export-excel')
  @RequirePermissions(PERMISSIONS.VIEW_STUDENTS)
  async exportExcel(
    @CurrentUser() currentUser: JwtPayload,
    @Res() res: Response,
    @Query() filter: StudentFilterDto,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    const buffer = await this.studentExcelService.exportToExcel(
      currentUser,
      filter,
      locale,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="students-list.xlsx"',
    );
    return res.send(buffer);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  async importExcel(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
    @Query('instituteId') queryInstituteId?: string,
    @Body('instituteId') bodyInstituteId?: string,
  ) {
    const instituteId = queryInstituteId || bodyInstituteId;
    if (!file || !file.buffer) {
      throw new BadRequestException(
        locale === 'fa'
          ? 'لطفاً فایل اکسل معتبر را انتخاب کنید'
          : 'Please select a valid Excel file',
      );
    }
    return this.studentExcelService.importFromExcel(
      currentUser,
      file.buffer,
      locale,
      instituteId,
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

  @Post('bulk-availability')
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  async setAllAvailable(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: SetAllStudentsAvailableDto,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    return this.studentAvailabilityService.setAllStudentsAvailable(
      currentUser,
      dto,
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

  @Get(':id/availabilities')
  @RequirePermissions(PERMISSIONS.VIEW_STUDENTS)
  async getAvailabilities(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Query('operatingPhaseId') operatingPhaseId?: string,
  ) {
    return this.studentAvailabilityService.getAvailabilities(
      currentUser,
      id,
      operatingPhaseId,
    );
  }

  @Put(':id/availabilities')
  @RequirePermissions(PERMISSIONS.MANAGE_STUDENTS)
  async updateAvailabilities(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentAvailabilitiesDto,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    return this.studentAvailabilityService.updateAvailabilities(
      currentUser,
      id,
      dto,
      locale,
    );
  }
}
