import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CoursesService } from './courses.service';
import { CourseExcelService } from './course-excel.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
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

@Controller('courses')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseExcelService: CourseExcelService,
  ) {}

  @Get('excel-template')
  @RequirePermissions(PERMISSIONS.MANAGE_COURSES)
  excelTemplate(
    @Res() res: Response,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ) {
    const buffer = this.courseExcelService.generateTemplate(locale);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="courses-import-template.xlsx"',
    );
    return res.send(buffer);
  }

  @Get('export-excel')
  @RequirePermissions(PERMISSIONS.VIEW_COURSES)
  async exportExcel(
    @CurrentUser() currentUser: JwtPayload,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('prerequisiteId') prerequisiteId?: string,
    @Query('instituteId') instituteId?: string,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ) {
    const buffer = await this.courseExcelService.exportToExcel(
      currentUser,
      { search, prerequisiteId, instituteId },
      locale,
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="courses-list.xlsx"',
    );
    return res.send(buffer);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(PERMISSIONS.MANAGE_COURSES)
  async importExcel(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale = 'fa',
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
    return this.courseExcelService.importFromExcel(
      currentUser,
      file.buffer,
      locale,
      instituteId,
    );
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_COURSES)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
    @Query('search') search?: string,
    @Query('prerequisiteId') prerequisiteId?: string,
  ) {
    return this.coursesService.findAll(
      currentUser,
      targetInstituteId,
      search,
      prerequisiteId,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_COURSES)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.coursesService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_COURSES)
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.coursesService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_COURSES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.coursesService.update(id, dto, currentUser, locale);
  }
}
