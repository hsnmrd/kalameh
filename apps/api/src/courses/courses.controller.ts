import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
  ) {
    return this.coursesService.findAll(currentUser, targetInstituteId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.coursesService.findOne(id, currentUser, locale);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async create(
    @Body() dto: CreateCourseDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.coursesService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.coursesService.update(id, dto, currentUser, locale);
  }
}
