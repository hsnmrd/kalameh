import { Injectable } from '@nestjs/common';
import type {
  JwtPayload,
  ReplaceTeacherCoursesInput,
  SupportedLocale,
  TeacherCourseQualificationsDto,
  TeacherLookupResponse,
} from '@workspace/types';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { ReplaceTeacherAvailabilitiesDto } from './dto/replace-teacher-availabilities.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherAvailabilityService } from './teacher-availability.service';
import { TeacherCreateService } from './teacher-create.service';
import { TeacherLifecycleService } from './teacher-lifecycle.service';
import { TeacherQualificationsService } from './teacher-qualifications.service';
import { TeacherQueryService } from './teacher-query.service';
import { TeacherUpdateService } from './teacher-update.service';

@Injectable()
export class TeachersService {
  constructor(
    private readonly createService: TeacherCreateService,
    private readonly queryService: TeacherQueryService,
    private readonly updateService: TeacherUpdateService,
    private readonly lifecycle: TeacherLifecycleService,
    private readonly availability: TeacherAvailabilityService,
    private readonly qualifications: TeacherQualificationsService,
  ) {}
  create(
    currentUser: JwtPayload,
    dto: CreateTeacherDto,
    locale: SupportedLocale = 'fa',
    file?: Express.Multer.File,
  ) {
    return this.createService.create(currentUser, dto, locale, file);
  }
  findAll(
    currentUser: JwtPayload,
    query: { search?: string; isActive?: boolean; instituteId?: string },
    locale: SupportedLocale = 'fa',
  ) {
    return this.queryService.findAll(currentUser, query, locale);
  }
  findOne(currentUser: JwtPayload, id: string, locale: SupportedLocale = 'fa') {
    return this.queryService.findOne(currentUser, id, locale);
  }
  update(
    currentUser: JwtPayload,
    id: string,
    dto: UpdateTeacherDto,
    locale: SupportedLocale = 'fa',
    file?: Express.Multer.File,
  ) {
    return this.updateService.update(currentUser, id, dto, locale, file);
  }
  findCourseQualifications(
    currentUser: JwtPayload,
    teacherId: string,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<TeacherCourseQualificationsDto> {
    return this.qualifications.findCourseQualifications(
      currentUser,
      teacherId,
      requestedInstituteId,
      locale,
    );
  }
  replaceCourseQualifications(
    currentUser: JwtPayload,
    teacherId: string,
    input: ReplaceTeacherCoursesInput,
    requestedInstituteId?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<TeacherCourseQualificationsDto> {
    return this.qualifications.replaceCourseQualifications(
      currentUser,
      teacherId,
      input,
      requestedInstituteId,
      locale,
    );
  }
  replaceAvailabilities(
    currentUser: JwtPayload,
    teacherId: string,
    dto: ReplaceTeacherAvailabilitiesDto,
    locale: SupportedLocale = 'fa',
  ) {
    return this.availability.replaceAvailabilities(
      currentUser,
      teacherId,
      dto,
      locale,
    );
  }
  resetPassword(
    currentUser: JwtPayload,
    id: string,
    newPassword?: string,
    locale: SupportedLocale = 'fa',
  ) {
    return this.lifecycle.resetPassword(currentUser, id, newPassword, locale);
  }
  remove(currentUser: JwtPayload, id: string, locale: SupportedLocale = 'fa') {
    return this.lifecycle.remove(currentUser, id, locale);
  }
  lookup(
    currentUser: JwtPayload,
    nationalCode?: string,
    phone?: string,
  ): Promise<TeacherLookupResponse> {
    return this.queryService.lookup(currentUser, nationalCode, phone);
  }
}
