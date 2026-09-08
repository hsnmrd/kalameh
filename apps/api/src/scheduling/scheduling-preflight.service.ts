import { Injectable } from '@nestjs/common';
import {
  SchedulingPreflightReportSchema,
  type SchedulingPreflightIssue,
  type SchedulingPreflightReport,
} from '@workspace/types';

type PreflightRequirement = {
  id: string;
  courseId: string;
  capacity: number;
  deliveryMode: 'IN_PERSON' | 'ONLINE';
};

type PreflightTeacherQualification = {
  courseId: string;
  teacherProfile: {
    userId: string;
    user: { isActive: boolean };
    availabilities: unknown[];
  };
};

type PreflightStudent = {
  studentProfile: { scheduleStatus: 'COMPLETE' | 'INCOMPLETE' } | null;
};

type PreflightClassroom = {
  id: string;
  capacity: number;
};

type PreflightActiveTeacher = {
  id: string;
  teacherProfile: { teachableCourses: unknown[] } | null;
};

export type SchedulingPreflightInput = {
  checkedAt?: Date;
  requirements: PreflightRequirement[];
  teachers: PreflightTeacherQualification[];
  students: PreflightStudent[];
  classrooms: PreflightClassroom[];
  activeTeachers: PreflightActiveTeacher[];
};

@Injectable()
export class SchedulingPreflightService {
  evaluate(input: SchedulingPreflightInput): SchedulingPreflightReport {
    const issues: SchedulingPreflightIssue[] = [];
    const courseIds = Array.from(
      new Set(input.requirements.map((requirement) => requirement.courseId)),
    ).sort();

    for (const courseId of courseIds) {
      const qualifiedTeachers = input.teachers.filter(
        (qualification) =>
          qualification.courseId === courseId &&
          qualification.teacherProfile.user.isActive,
      );

      if (qualifiedTeachers.length === 0) {
        issues.push({
          code: 'COURSE_WITHOUT_QUALIFIED_TEACHER',
          severity: 'BLOCKING',
          scope: 'COURSE',
          entityId: courseId,
          context: {},
        });
        continue;
      }

      if (
        qualifiedTeachers.every(
          (qualification) =>
            qualification.teacherProfile.availabilities.length === 0,
        )
      ) {
        issues.push({
          code: 'COURSE_WITHOUT_AVAILABLE_TEACHER',
          severity: 'BLOCKING',
          scope: 'COURSE',
          entityId: courseId,
          context: { qualifiedTeacherCount: qualifiedTeachers.length },
        });
      }
    }

    for (const requirement of input.requirements) {
      if (
        requirement.deliveryMode === 'IN_PERSON' &&
        input.classrooms.every(
          (classroom) => classroom.capacity < requirement.capacity,
        )
      ) {
        issues.push({
          code: 'NO_CLASSROOM_WITH_REQUIRED_CAPACITY',
          severity: 'WARNING',
          scope: 'REQUIREMENT',
          entityId: requirement.id,
          context: { requiredCapacity: requirement.capacity },
        });
      }
    }

    const completeStudentScheduleCount = input.students.filter(
      (student) => student.studentProfile?.scheduleStatus === 'COMPLETE',
    ).length;
    const incompleteStudentScheduleCount =
      input.students.length - completeStudentScheduleCount;

    if (incompleteStudentScheduleCount > 0) {
      issues.push({
        code: 'INCOMPLETE_STUDENT_SCHEDULE_DATA',
        severity: 'WARNING',
        scope: 'INPUT',
        context: {
          studentCount: input.students.length,
          incompleteStudentScheduleCount,
        },
      });
    }

    if (input.students.length === 0) {
      issues.push({
        code: 'NO_ELIGIBLE_STUDENTS',
        severity: 'INFO',
        scope: 'INPUT',
        context: {},
      });
    }

    const teacherWithoutQualificationCount = input.activeTeachers.filter(
      (teacher) =>
        !teacher.teacherProfile ||
        teacher.teacherProfile.teachableCourses.length === 0,
    ).length;
    if (teacherWithoutQualificationCount > 0) {
      issues.push({
        code: 'TEACHERS_WITHOUT_COURSE_QUALIFICATION',
        severity: 'INFO',
        scope: 'INPUT',
        context: {
          activeTeacherCount: input.activeTeachers.length,
          teacherWithoutQualificationCount,
        },
      });
    }

    const blockingIssueCount = issues.filter(
      (issue) => issue.severity === 'BLOCKING',
    ).length;
    return SchedulingPreflightReportSchema.parse({
      schemaVersion: '1',
      checkedAt: input.checkedAt ?? new Date(),
      passed: blockingIssueCount === 0,
      summary: {
        blockingIssueCount,
        warningCount: issues.filter((issue) => issue.severity === 'WARNING')
          .length,
        infoCount: issues.filter((issue) => issue.severity === 'INFO').length,
        requirementCount: input.requirements.length,
        courseCount: courseIds.length,
        studentCount: input.students.length,
        completeStudentScheduleCount,
        activeTeacherCount: input.activeTeachers.length,
        teacherWithoutQualificationCount,
      },
      issues,
    });
  }
}
