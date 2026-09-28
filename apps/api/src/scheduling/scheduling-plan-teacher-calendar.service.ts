import { Injectable } from '@nestjs/common';
import {
  ROLES,
  SchedulingEngineInputSnapshotSchema,
  type SchedulingTeacherCalendar,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingTeacherCalendarService } from './scheduling-teacher-calendar.service';

type PlanTeacherCalendarInput = {
  instituteId: string;
  inputSnapshot: unknown;
  proposals: Array<{
    id: string;
    title: string;
    teacherId: string | null;
    daysOfWeek: string[];
    startTime: string;
    endTime: string;
  }>;
};

@Injectable()
export class SchedulingPlanTeacherCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teacherCalendarService: SchedulingTeacherCalendarService,
  ) {}

  async build(
    input: PlanTeacherCalendarInput,
  ): Promise<SchedulingTeacherCalendar[]> {
    const snapshot = SchedulingEngineInputSnapshotSchema.parse(
      input.inputSnapshot,
    );
    const [teachers, existingClasses] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          instituteId: input.instituteId,
          role: ROLES.TEACHER,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          teacherProfile: {
            select: {
              availabilities: {
                select: {
                  id: true,
                  dayOfWeek: true,
                  startTime: true,
                  endTime: true,
                },
              },
              teachableCourses: {
                where: { instituteId: input.instituteId },
                select: {
                  course: { select: { id: true, title: true } },
                },
                orderBy: { course: { title: 'asc' } },
              },
            },
          },
        },
      }),
      this.prisma.class.findMany({
        where: {
          instituteId: input.instituteId,
          id: { in: snapshot.existingClasses.map(({ id }) => id) },
        },
        select: { id: true, title: true },
      }),
    ]);

    return this.teacherCalendarService.build({
      courseId: null,
      qualifications: [],
      teachers: teachers.map(({ teacherProfile, ...teacher }) => ({
        ...teacher,
        availabilities: teacherProfile?.availabilities ?? [],
        teachableCourses:
          teacherProfile?.teachableCourses.map(({ course }) => course) ?? [],
      })),
      proposals: input.proposals,
      existingClasses: snapshot.existingClasses,
      existingClassTitles: new Map(
        existingClasses.map((existingClass) => [
          existingClass.id,
          existingClass.title,
        ]),
      ),
    });
  }
}
