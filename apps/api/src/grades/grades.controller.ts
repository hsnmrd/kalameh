import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { SubmitFinalGradesDto } from './dto/submit-grades.dto';
import { SetStudentLevelDto } from './dto/set-student-level.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('classes/:classId')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async getClassStudents(
    @Param('classId') classId: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.gradesService.getClassStudentsAndGrades(
      classId,
      currentUser,
      locale,
    );
  }

  @Post('classes/:classId')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async submitClassGrades(
    @Param('classId') classId: string,
    @Body() dto: SubmitFinalGradesDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.gradesService.submitClassGrades(
      classId,
      dto,
      currentUser,
      locale,
    );
  }

  @Patch('students/:studentId/level')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async setStudentLevel(
    @Param('studentId') studentId: string,
    @Body() dto: SetStudentLevelDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.gradesService.setStudentLevel(
      studentId,
      dto,
      currentUser,
      locale,
    );
  }
}
