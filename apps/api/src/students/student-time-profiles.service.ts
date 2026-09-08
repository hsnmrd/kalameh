import { Injectable } from '@nestjs/common';
import {
  StudentTimeProfileSchema,
  type JwtPayload,
  type ReplaceStudentTimeProfileInput,
  type StudentTimeProfileDto,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentTimeProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findOne(
    currentUser: JwtPayload,
    studentId: string,
  ): Promise<StudentTimeProfileDto> {
    const student = await this.findStudent(currentUser, studentId);

    return this.toDto(student);
  }

  async replace(
    currentUser: JwtPayload,
    studentId: string,
    input: ReplaceStudentTimeProfileInput,
  ): Promise<StudentTimeProfileDto> {
    const student = await this.findStudent(currentUser, studentId);
    const previousScheduleStatus =
      student.studentProfile?.scheduleStatus ?? 'INCOMPLETE';
    const previousConstraintCount =
      student.studentProfile?.timeConstraints.length ?? 0;

    const profile = await this.prisma.$transaction(async (tx) => {
      const storedProfile = await tx.studentProfile.upsert({
        where: { userId: student.id },
        create: {
          userId: student.id,
          scheduleStatus: input.scheduleStatus,
        },
        update: {
          scheduleStatus: input.scheduleStatus,
        },
        select: { id: true },
      });

      await tx.studentTimeConstraint.deleteMany({
        where: {
          instituteId: student.instituteId,
          studentProfileId: storedProfile.id,
        },
      });

      if (input.constraints.length > 0) {
        await tx.studentTimeConstraint.createMany({
          data: input.constraints.map((constraint) => ({
            instituteId: student.instituteId,
            studentProfileId: storedProfile.id,
            kind: constraint.kind,
            source: constraint.source,
            dayOfWeek: constraint.dayOfWeek,
            startTime: constraint.startTime,
            endTime: constraint.endTime,
            label: constraint.label ?? null,
            effectiveFrom: constraint.effectiveFrom
              ? new Date(constraint.effectiveFrom)
              : null,
            effectiveUntil: constraint.effectiveUntil
              ? new Date(constraint.effectiveUntil)
              : null,
          })),
        });
      }

      return tx.studentProfile.findUniqueOrThrow({
        where: {
          id: storedProfile.id,
          user: { instituteId: student.instituteId },
        },
        select: {
          id: true,
          scheduleStatus: true,
          timeConstraints: {
            where: { instituteId: student.instituteId },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          },
        },
      });
    });

    await this.auditLogsService.log({
      instituteId: student.instituteId,
      userId: currentUser.sub,
      module: 'STUDENT_TIME_PROFILE',
      entityId: student.id,
      action: 'REPLACE',
      metadata: {
        previousScheduleStatus,
        scheduleStatus: profile.scheduleStatus,
        previousConstraintCount,
        constraintCount: profile.timeConstraints.length,
      },
    });

    return StudentTimeProfileSchema.parse({
      studentId: student.id,
      studentProfileId: profile.id,
      scheduleStatus: profile.scheduleStatus,
      constraints: profile.timeConstraints,
    });
  }

  private findStudent(currentUser: JwtPayload, studentId: string) {
    return this.prisma.user.findFirstOrThrow({
      where: {
        id: studentId,
        role: 'STUDENT',
        ...(currentUser.role === 'SUPER_ADMIN'
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      select: {
        id: true,
        instituteId: true,
        studentProfile: {
          select: {
            id: true,
            scheduleStatus: true,
            timeConstraints: {
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            },
          },
        },
      },
    });
  }

  private toDto(
    student: Awaited<ReturnType<StudentTimeProfilesService['findStudent']>>,
  ): StudentTimeProfileDto {
    return StudentTimeProfileSchema.parse({
      studentId: student.id,
      studentProfileId: student.studentProfile?.id ?? null,
      scheduleStatus: student.studentProfile?.scheduleStatus ?? 'INCOMPLETE',
      constraints: student.studentProfile?.timeConstraints ?? [],
    });
  }
}
