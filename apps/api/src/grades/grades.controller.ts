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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  PERMISSIONS,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('grades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('classes/:classId')
  @RequirePermissions(PERMISSIONS.VIEW_GRADES)
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
  @RequirePermissions(PERMISSIONS.MANAGE_GRADES)
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
  @RequirePermissions(PERMISSIONS.MANAGE_GRADES)
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
