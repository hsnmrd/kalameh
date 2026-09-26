import { ConflictException } from '@nestjs/common';
import type {
  ClassConflictItem,
  ClassConflictResult,
  JwtPayload,
  SupportedLocale,
} from '@workspace/types';
import { I18nService } from '../i18n/i18n.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckClassConflictsDto } from './dto/check-class-conflicts.dto';

export class ClassScheduleConflicts {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  private parseTimeToMinutes(timeStr: string): number {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0] ?? '0', 10);
    const minutes = parseInt(parts[1] ?? '0', 10);
    return hours * 60 + minutes;
  }

  private normalizePersianText(str?: string | null): string {
    if (!str) return '';
    return str
      .trim()
      .replace(/\u064A/g, '\u06CC')
      .replace(/\u0643/g, '\u06A9')
      .replace(/\u0649/g, '\u06CC')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private hasTimeOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
  ): boolean {
    const sA = this.parseTimeToMinutes(startA);
    const eA = this.parseTimeToMinutes(endA);
    const sB = this.parseTimeToMinutes(startB);
    const eB = this.parseTimeToMinutes(endB);
    // Overlap condition: startA < endB && startB < endA
    return sA < eB && sB < eA;
  }

  async checkConflicts(
    dto: CheckClassConflictsDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassConflictResult> {
    let instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (!instituteId || currentUser.role === 'SUPER_ADMIN') {
      const term = await this.prisma.term.findUnique({
        where: { id: dto.termId },
        select: { instituteId: true },
      });
      if (term) {
        instituteId = term.instituteId;
      }
    }

    if (!dto.startTime || !dto.endTime) {
      return { hasConflict: false, conflictingDates: [], conflicts: [] };
    }

    const trimmedTeacher = dto.teacherName?.trim();
    if (!dto.classroomId && !trimmedTeacher && !dto.teacherId) {
      return { hasConflict: false, conflictingDates: [], conflicts: [] };
    }

    const daysCount = dto.daysOfWeek?.length ?? 0;
    const sessionsCount = dto.sessionDates?.length ?? 0;
    if (daysCount === 0 && sessionsCount === 0) {
      return { hasConflict: false, conflictingDates: [], conflicts: [] };
    }

    const orConditions: Array<{
      classroomId?: string;
      teacherId?: string;
      teacherName?: { equals: string; mode: 'insensitive' };
    }> = [];

    if (dto.classroomId) {
      orConditions.push({ classroomId: dto.classroomId });
    }

    if (dto.teacherId) {
      orConditions.push({ teacherId: dto.teacherId });
    }

    if (trimmedTeacher) {
      const normalized = this.normalizePersianText(trimmedTeacher);
      const arabicYehVariant = trimmedTeacher
        .replace(/\u06CC/g, '\u064A')
        .replace(/\u06A9/g, '\u0643');
      const persianYehVariant = trimmedTeacher
        .replace(/\u064A/g, '\u06CC')
        .replace(/\u0643/g, '\u06A9');

      const seenVariants = new Set<string>();
      for (const variant of [
        trimmedTeacher,
        normalized,
        arabicYehVariant,
        persianYehVariant,
      ]) {
        if (!seenVariants.has(variant)) {
          seenVariants.add(variant);
          orConditions.push({
            teacherName: {
              equals: variant,
              mode: 'insensitive',
            },
          });
        }
      }
    }

    const candidateClasses = await this.prisma.class.findMany({
      where: {
        instituteId,
        termId: dto.termId,
        ...(dto.excludeClassId ? { id: { not: dto.excludeClassId } } : {}),
        startTime: { not: null },
        endTime: { not: null },
        OR: orConditions,
      },
      select: {
        id: true,
        title: true,
        classroomId: true,
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        teacherId: true,
        teacherName: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        sessionDates: true,
      },
    });

    const conflicts: ClassConflictItem[] = [];
    const allConflictingDates = new Set<string>();

    for (const candidate of candidateClasses) {
      if (!candidate.startTime || !candidate.endTime) continue;

      const timeCollision = this.hasTimeOverlap(
        dto.startTime,
        dto.endTime,
        candidate.startTime,
        candidate.endTime,
      );

      if (!timeCollision) continue;

      const collidingDates = this.getCollidingDates(
        dto.daysOfWeek ?? [],
        dto.sessionDates ?? [],
        candidate.daysOfWeek ?? [],
        candidate.sessionDates ?? [],
      );

      if (collidingDates.length === 0) continue;

      const isClassroomCollision = Boolean(
        dto.classroomId && candidate.classroomId === dto.classroomId,
      );

      const isTeacherCollision = Boolean(
        (dto.teacherId && candidate.teacherId === dto.teacherId) ||
        (trimmedTeacher &&
          this.normalizePersianText(candidate.teacherName) ===
            this.normalizePersianText(trimmedTeacher)),
      );

      // Check classroom collision
      if (isClassroomCollision) {
        collidingDates.forEach((d) => allConflictingDates.add(d));
        conflicts.push({
          type: 'CLASSROOM',
          conflictingClassId: candidate.id,
          conflictingClassTitle: candidate.title,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          teacherName: candidate.teacherName,
          classroomName: candidate.classroom?.name,
          message: this.i18n.t('classes.classroomConflict', locale, {
            conflictingClass: candidate.title,
          }),
          conflictingDates: collidingDates,
        });
      }

      // Check teacher collision:
      // If the class already has a classroom collision and the teacher is the same,
      // only show the classroom collision (skip redundant teacher conflict for that class).
      if (isTeacherCollision && !isClassroomCollision) {
        collidingDates.forEach((d) => allConflictingDates.add(d));
        conflicts.push({
          type: 'TEACHER',
          conflictingClassId: candidate.id,
          conflictingClassTitle: candidate.title,
          startTime: candidate.startTime,
          endTime: candidate.endTime,
          teacherName: candidate.teacherName,
          classroomName: candidate.classroom?.name,
          message: this.i18n.t('classes.teacherConflict', locale, {
            conflictingClass: candidate.title,
          }),
          conflictingDates: collidingDates,
        });
      }
    }

    // Check teacher free-time availability
    if (dto.teacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: {
          id: dto.teacherId,
          instituteId,
        },
        include: {
          teacherProfile: {
            include: { availabilities: true },
          },
        },
      });

      if (
        teacher?.teacherProfile?.availabilities &&
        teacher.teacherProfile.availabilities.length > 0
      ) {
        const availabilities = teacher.teacherProfile.availabilities;
        const JS_DAY_TO_WEEKDAY: Record<number, string> = {
          0: 'SUNDAY',
          1: 'MONDAY',
          2: 'TUESDAY',
          3: 'WEDNESDAY',
          4: 'THURSDAY',
          5: 'FRIDAY',
          6: 'SATURDAY',
        };

        const violatingDays: string[] = [];
        for (const day of dto.daysOfWeek ?? []) {
          const matchingSlots = availabilities.filter(
            (a) => a.dayOfWeek === day,
          );
          const fitsSlot = matchingSlots.some(
            (slot) =>
              slot.startTime <= dto.startTime! && slot.endTime >= dto.endTime!,
          );
          if (!fitsSlot) {
            violatingDays.push(day);
          }
        }

        const violatingDates: string[] = [];
        for (const dateStr of dto.sessionDates ?? []) {
          const d = new Date(dateStr);
          if (isNaN(d.getTime())) continue;
          const dayOfWeek = JS_DAY_TO_WEEKDAY[d.getDay()];
          const matchingSlots = availabilities.filter(
            (a) => a.dayOfWeek === dayOfWeek,
          );
          const fitsSlot = matchingSlots.some(
            (slot) =>
              slot.startTime <= dto.startTime! && slot.endTime >= dto.endTime!,
          );
          if (!fitsSlot) {
            violatingDates.push(dateStr);
          }
        }

        const allViolating = Array.from(
          new Set([...violatingDays, ...violatingDates]),
        ).sort();

        if (allViolating.length > 0) {
          allViolating.forEach((v) => allConflictingDates.add(v));
          const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;
          conflicts.push({
            type: 'TEACHER_FREE_TIME',
            teacherName: teacherFullName,
            startTime: dto.startTime,
            endTime: dto.endTime,
            message: this.i18n.t('classes.teacherFreeTimeConflict', locale, {
              teacherName: teacherFullName,
            }),
            conflictingDates: allViolating,
          });
        }
      }
    }

    const sortedConflictingDates = Array.from(allConflictingDates).sort();

    return {
      hasConflict: conflicts.length > 0,
      conflictingDates: sortedConflictingDates,
      conflicts,
    };
  }

  private getCollidingDates(
    daysA: string[] = [],
    sessionsA: string[] = [],
    daysB: string[] = [],
    sessionsB: string[] = [],
  ): string[] {
    // If both have specific calendar session dates
    if (sessionsA.length > 0 && sessionsB.length > 0) {
      const setB = new Set(sessionsB);
      return sessionsA.filter((date) => setB.has(date));
    }

    const JS_DAY_TO_WEEKDAY: Record<number, string> = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY',
    };

    // If A has sessionDates and B has daysOfWeek
    if (sessionsA.length > 0 && daysB.length > 0) {
      const setB = new Set(daysB);
      return sessionsA.filter((dateStr) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        return setB.has(JS_DAY_TO_WEEKDAY[d.getDay()]);
      });
    }

    // If A has daysOfWeek and B has sessionDates
    if (daysA.length > 0 && sessionsB.length > 0) {
      const setA = new Set(daysA);
      return sessionsB.filter((dateStr) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return false;
        return setA.has(JS_DAY_TO_WEEKDAY[d.getDay()]);
      });
    }

    // If both have only daysOfWeek
    if (daysA.length > 0 && daysB.length > 0) {
      const setB = new Set(daysB);
      return daysA.filter((d) => setB.has(d));
    }

    return [];
  }

  private hasDayOrDateOverlap(
    daysA: string[] = [],
    sessionsA: string[] = [],
    daysB: string[] = [],
    sessionsB: string[] = [],
  ): boolean {
    return (
      this.getCollidingDates(daysA, sessionsA, daysB, sessionsB).length > 0
    );
  }

  async validateScheduleConflicts(
    instituteId: string,
    termId: string,
    scheduleInfo: {
      classroomId?: string | null;
      teacherId?: string | null;
      teacherName?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      daysOfWeek?: string[] | null;
      sessionDates?: string[] | null;
    },
    locale: SupportedLocale,
    excludeClassId?: string,
  ): Promise<void> {
    if (!scheduleInfo.startTime || !scheduleInfo.endTime) {
      return;
    }

    const trimmedTeacher = scheduleInfo.teacherName?.trim();
    if (
      !scheduleInfo.classroomId &&
      !trimmedTeacher &&
      !scheduleInfo.teacherId
    ) {
      return;
    }

    const daysCount = scheduleInfo.daysOfWeek?.length ?? 0;
    const sessionsCount = scheduleInfo.sessionDates?.length ?? 0;
    if (daysCount === 0 && sessionsCount === 0) {
      return;
    }

    const orConditions: Array<{
      classroomId?: string;
      teacherId?: string;
      teacherName?: { equals: string; mode: 'insensitive' };
    }> = [];

    if (scheduleInfo.classroomId) {
      orConditions.push({ classroomId: scheduleInfo.classroomId });
    }

    if (scheduleInfo.teacherId) {
      orConditions.push({ teacherId: scheduleInfo.teacherId });
    }

    if (trimmedTeacher) {
      const normalized = this.normalizePersianText(trimmedTeacher);
      const arabicYehVariant = trimmedTeacher
        .replace(/\u06CC/g, '\u064A')
        .replace(/\u06A9/g, '\u0643');
      const persianYehVariant = trimmedTeacher
        .replace(/\u064A/g, '\u06CC')
        .replace(/\u0643/g, '\u06A9');

      const seenVariants = new Set<string>();
      for (const variant of [
        trimmedTeacher,
        normalized,
        arabicYehVariant,
        persianYehVariant,
      ]) {
        if (!seenVariants.has(variant)) {
          seenVariants.add(variant);
          orConditions.push({
            teacherName: {
              equals: variant,
              mode: 'insensitive',
            },
          });
        }
      }
    }

    const candidateClasses = await this.prisma.class.findMany({
      where: {
        instituteId,
        termId,
        ...(excludeClassId ? { id: { not: excludeClassId } } : {}),
        startTime: { not: null },
        endTime: { not: null },
        OR: orConditions,
      },
      select: {
        id: true,
        title: true,
        classroomId: true,
        teacherId: true,
        teacherName: true,
        startTime: true,
        endTime: true,
        daysOfWeek: true,
        sessionDates: true,
      },
    });

    for (const candidate of candidateClasses) {
      if (!candidate.startTime || !candidate.endTime) continue;

      const timeCollision = this.hasTimeOverlap(
        scheduleInfo.startTime,
        scheduleInfo.endTime,
        candidate.startTime,
        candidate.endTime,
      );

      if (!timeCollision) continue;

      const dayCollision = this.hasDayOrDateOverlap(
        scheduleInfo.daysOfWeek ?? [],
        scheduleInfo.sessionDates ?? [],
        candidate.daysOfWeek ?? [],
        candidate.sessionDates ?? [],
      );

      if (!dayCollision) continue;

      // Check classroom collision
      if (
        scheduleInfo.classroomId &&
        candidate.classroomId === scheduleInfo.classroomId
      ) {
        throw new ConflictException(
          this.i18n.t('classes.classroomConflict', locale, {
            conflictingClass: candidate.title,
          }),
        );
      }

      // Check teacher collision
      const isTeacherCollision = Boolean(
        (scheduleInfo.teacherId &&
          candidate.teacherId === scheduleInfo.teacherId) ||
        (trimmedTeacher &&
          this.normalizePersianText(candidate.teacherName) ===
            this.normalizePersianText(trimmedTeacher)),
      );

      if (isTeacherCollision) {
        throw new ConflictException(
          this.i18n.t('classes.teacherConflict', locale, {
            conflictingClass: candidate.title,
          }),
        );
      }
    }

    // Check teacher free-time availability
    if (scheduleInfo.teacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: {
          id: scheduleInfo.teacherId,
          instituteId,
        },
        include: {
          teacherProfile: {
            include: { availabilities: true },
          },
        },
      });

      if (
        teacher?.teacherProfile?.availabilities &&
        teacher.teacherProfile.availabilities.length > 0
      ) {
        const availabilities = teacher.teacherProfile.availabilities;
        const JS_DAY_TO_WEEKDAY: Record<number, string> = {
          0: 'SUNDAY',
          1: 'MONDAY',
          2: 'TUESDAY',
          3: 'WEDNESDAY',
          4: 'THURSDAY',
          5: 'FRIDAY',
          6: 'SATURDAY',
        };

        const hasInvalidDay = (scheduleInfo.daysOfWeek ?? []).some((day) => {
          const matchingSlots = availabilities.filter(
            (a) => a.dayOfWeek === day,
          );
          return !matchingSlots.some(
            (slot) =>
              slot.startTime <= scheduleInfo.startTime! &&
              slot.endTime >= scheduleInfo.endTime!,
          );
        });

        const hasInvalidDate = (scheduleInfo.sessionDates ?? []).some(
          (dateStr) => {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return false;
            const dayOfWeek = JS_DAY_TO_WEEKDAY[d.getDay()];
            const matchingSlots = availabilities.filter(
              (a) => a.dayOfWeek === dayOfWeek,
            );
            return !matchingSlots.some(
              (slot) =>
                slot.startTime <= scheduleInfo.startTime! &&
                slot.endTime >= scheduleInfo.endTime!,
            );
          },
        );

        if (hasInvalidDay || hasInvalidDate) {
          const teacherFullName = `${teacher.firstName} ${teacher.lastName}`;
          throw new ConflictException(
            this.i18n.t('classes.teacherFreeTimeConflict', locale, {
              teacherName: teacherFullName,
            }),
          );
        }
      }
    }
  }
}
