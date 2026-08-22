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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateStudentDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.create(currentUser, dto, locale);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
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
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.studentsService.findOne(currentUser, id, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
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
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
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
