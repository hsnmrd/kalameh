import { Injectable } from '@nestjs/common';
import type {
  ClassConflictResult,
  ClassDto,
  JwtPayload,
  SupportedLocale,
} from '@workspace/types';
import { ClassCreateService } from './class-create.service';
import { ClassLifecycleService } from './class-lifecycle.service';
import { ClassQueryService } from './class-query.service';
import { ClassScheduleConflicts } from './class-schedule-conflicts';
import { ClassUpdateService } from './class-update.service';
import { CheckClassConflictsDto } from './dto/check-class-conflicts.dto';
import { ClassFilterDto } from './dto/class-filter.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
@Injectable()
export class ClassesService {
  constructor(
    private readonly queries: ClassQueryService,
    private readonly createService: ClassCreateService,
    private readonly updateService: ClassUpdateService,
    private readonly lifecycle: ClassLifecycleService,
    private readonly scheduleConflicts: ClassScheduleConflicts,
  ) {}
  findAll(
    currentUser: JwtPayload,
    filter?: ClassFilterDto,
  ): Promise<ClassDto[]> {
    return this.queries.findAll(currentUser, filter);
  }
  findAvailableForStudent(
    currentUser: JwtPayload,
  ): Promise<{ allowedCourseTitle?: string; classes: ClassDto[] }> {
    return this.queries.findAvailableForStudent(currentUser);
  }
  findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    return this.queries.findOne(id, currentUser, locale);
  }
  create(
    dto: CreateClassDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    return this.createService.create(dto, currentUser, locale);
  }
  async update(
    id: string,
    dto: UpdateClassDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const existing = await this.findOne(id, currentUser, locale);
    return this.updateService.update(id, dto, currentUser, existing, locale);
  }
  checkConflicts(
    dto: CheckClassConflictsDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassConflictResult> {
    return this.scheduleConflicts.checkConflicts(dto, currentUser, locale);
  }
  remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ success: boolean }> {
    return this.lifecycle.remove(id, currentUser, locale);
  }
}
