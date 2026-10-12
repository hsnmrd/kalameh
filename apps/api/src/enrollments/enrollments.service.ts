import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { ReserveClassDto } from './dto/reserve-class.dto';
import { WaitlistClassDto } from './dto/waitlist-class.dto';
import { PromoteWaitlistDto } from './dto/promote-waitlist.dto';
import { EnrollmentFilterDto } from './dto/enrollment-filter.dto';
import {
  ENROLLMENT_STATUSES,
  ROLES,
  type EnrollmentDto,
  type JwtPayload,
  type ReservationResponseDto,
  type SupportedLocale,
} from '@workspace/types';

const enrollmentInclude = {
  class: {
    select: {
      id: true,
      title: true,
      fee: true,
      capacity: true,
      schedule: true,
      teacherName: true,
      term: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  },
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
    },
  },
  transaction: {
    select: {
      id: true,
      amount: true,
      trackingCode: true,
      receiptImageUrl: true,
      status: true,
      paymentDate: true,
    },
  },
} as const;

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
  ) {}

  async reserve(
    currentUser: JwtPayload,
    dto: ReserveClassDto,
    locale: SupportedLocale,
  ): Promise<ReservationResponseDto> {
    if (
      currentUser.role !== ROLES.STUDENT &&
      currentUser.role !== ROLES.SUPER_STUDENT
    ) {
      throw new ForbiddenException(
        this.i18n.t('transactions.studentOnly', locale),
      );
    }

    const cls = await this.prisma.class.findFirstOrThrow({
      where: {
        id: dto.classId,
        instituteId: currentUser.instituteId,
      },
      include: {
        institute: {
          select: {
            bankCardNumber: true,
            bankAccountName: true,
            bankShaba: true,
          },
        },
      },
    });

    // Check if student already has active enrollment
    const existing = await this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: currentUser.sub,
          classId: dto.classId,
        },
      },
    });

    if (
      existing &&
      (existing.status === ENROLLMENT_STATUSES.ENROLLED ||
        existing.status === ENROLLMENT_STATUSES.PENDING_APPROVAL)
    ) {
      throw new BadRequestException(
        locale === 'fa'
          ? 'شما پیش از این در این کلاس ثبت‌نام کرده‌اید یا فیش شما در انتظار بررسی است.'
          : 'You are already enrolled or have a pending receipt for this class.',
      );
    }

    // Check student lock
    const hasExistingLock = await this.redis.hasClassLock(
      dto.classId,
      currentUser.sub,
    );

    if (!hasExistingLock) {
      // Calculate capacity
      const confirmedCount = await this.prisma.enrollment.count({
        where: {
          classId: dto.classId,
          status: {
            in: [
              ENROLLMENT_STATUSES.ENROLLED,
              ENROLLMENT_STATUSES.PENDING_APPROVAL,
            ],
          },
        },
      });

      const lockCount = await this.redis.countClassLocks(dto.classId);
      if (confirmedCount + lockCount >= cls.capacity) {
        throw new ConflictException(
          locale === 'fa'
            ? 'ظرفیت کلاس تکمیل شده است. می‌توانید در لیست انتظار ثبت‌نام کنید.'
            : 'Class capacity is full. You may join the waitlist.',
        );
      }

      await this.redis.acquireClassLock(dto.classId, currentUser.sub, 1800);
    }

    await this.prisma.enrollment.upsert({
      where: {
        studentId_classId: {
          studentId: currentUser.sub,
          classId: dto.classId,
        },
      },
      create: {
        studentId: currentUser.sub,
        classId: dto.classId,
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      },
      update: {
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      },
    });

    const ttl = await this.redis.getClassLockRemainingTtl(
      dto.classId,
      currentUser.sub,
    );
    const remainingSeconds = ttl > 0 ? ttl : 1800;

    return {
      classId: cls.id,
      classTitle: cls.title,
      tuition: cls.fee,
      reservedUntil: new Date(Date.now() + remainingSeconds * 1000),
      remainingSeconds,
      bankInfo: {
        bankCardNumber: cls.institute.bankCardNumber,
        bankAccountName: cls.institute.bankAccountName,
        bankShaba: cls.institute.bankShaba,
      },
      status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
    };
  }

  async cancelReservation(
    currentUser: JwtPayload,
    classId: string,
  ): Promise<{ success: boolean }> {
    await this.redis.releaseClassLock(classId, currentUser.sub);

    // If an enrollment is in PENDING_PAYMENT, remove it
    await this.prisma.enrollment.deleteMany({
      where: {
        studentId: currentUser.sub,
        classId,
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      },
    });

    return { success: true };
  }

  async joinWaitlist(
    currentUser: JwtPayload,
    dto: WaitlistClassDto,
    locale: SupportedLocale,
  ): Promise<EnrollmentDto> {
    if (
      currentUser.role !== ROLES.STUDENT &&
      currentUser.role !== ROLES.SUPER_STUDENT
    ) {
      throw new ForbiddenException(
        this.i18n.t('transactions.studentOnly', locale),
      );
    }

    const cls = await this.prisma.class.findFirstOrThrow({
      where: { id: dto.classId, instituteId: currentUser.instituteId },
    });

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        studentId_classId: {
          studentId: currentUser.sub,
          classId: dto.classId,
        },
      },
      create: {
        studentId: currentUser.sub,
        classId: dto.classId,
        status: ENROLLMENT_STATUSES.WAITLISTED,
      },
      update: {
        status: ENROLLMENT_STATUSES.WAITLISTED,
      },
      include: enrollmentInclude,
    });

    await this.auditLogsService.log({
      instituteId: currentUser.instituteId,
      userId: currentUser.sub,
      module: 'ENROLLMENT',
      entityId: enrollment.id,
      action: 'WAITLIST_JOIN',
      metadata: { classId: cls.id, classTitle: cls.title },
    });

    return enrollment;
  }

  async getMyEnrollments(currentUser: JwtPayload): Promise<EnrollmentDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: currentUser.sub,
      },
      include: enrollmentInclude,
      orderBy: { createdAt: 'desc' },
    });

    // Check active reservation in Redis
    const reservation = await this.redis.getStudentActiveReservation(
      currentUser.sub,
    );

    const list: EnrollmentDto[] = enrollments.map((e) => {
      let remainingReservationSeconds: number | undefined;
      if (e.classId === reservation?.classId) {
        remainingReservationSeconds = reservation.remainingSeconds;
      } else if (e.status === ENROLLMENT_STATUSES.PENDING_PAYMENT) {
        const updatedAtMs = new Date(e.updatedAt).getTime();
        const expiresAtMs = updatedAtMs + 1800 * 1000;
        const remaining = Math.max(
          0,
          Math.floor((expiresAtMs - Date.now()) / 1000),
        );
        remainingReservationSeconds = remaining > 0 ? remaining : 1800;
      }

      return {
        ...e,
        remainingReservationSeconds,
      };
    });

    // If student has an active reservation lock that is not yet in DB, synthesize it
    if (
      reservation &&
      !list.some(
        (e) =>
          e.classId === reservation.classId &&
          (e.status === ENROLLMENT_STATUSES.PENDING_PAYMENT ||
            e.status === ENROLLMENT_STATUSES.PENDING_APPROVAL ||
            e.status === ENROLLMENT_STATUSES.ENROLLED),
      )
    ) {
      const cls = await this.prisma.class.findUnique({
        where: { id: reservation.classId },
        include: {
          term: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      });

      if (cls) {
        list.unshift({
          id: `res-${cls.id}`,
          studentId: currentUser.sub,
          classId: cls.id,
          status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
          finalScore: null,
          isPassed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          class: {
            id: cls.id,
            title: cls.title,
            fee: cls.fee,
            capacity: cls.capacity,
            schedule: cls.schedule,
            teacherName: cls.teacherName,
            term: cls.term,
          },
          remainingReservationSeconds: reservation.remainingSeconds,
        });
      }
    }

    return list;
  }

  async findAll(
    currentUser: JwtPayload,
    filter: EnrollmentFilterDto,
  ): Promise<EnrollmentDto[]> {
    const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
    const instituteId = isSuperAdmin ? undefined : currentUser.instituteId;

    return this.prisma.enrollment.findMany({
      where: {
        ...(filter.classId ? { classId: filter.classId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.studentId ? { studentId: filter.studentId } : {}),
        class: {
          ...(instituteId ? { instituteId } : {}),
        },
      },
      include: enrollmentInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async promoteWaitlist(
    currentUser: JwtPayload,
    id: string,
    dto: PromoteWaitlistDto,
  ): Promise<EnrollmentDto> {
    const enrollment = await this.prisma.enrollment.findFirstOrThrow({
      where: {
        id,
        class:
          currentUser.role === ROLES.SUPER_ADMIN
            ? undefined
            : { instituteId: currentUser.instituteId },
      },
      include: enrollmentInclude,
    });

    if (enrollment.status !== ENROLLMENT_STATUSES.WAITLISTED) {
      throw new BadRequestException('Only waitlisted students can be promoted');
    }

    const updatedStatus = dto.status;
    if (dto.status === ENROLLMENT_STATUSES.PENDING_PAYMENT) {
      await this.redis.acquireClassLock(
        enrollment.classId,
        enrollment.studentId,
        1800,
      );
    }

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: { status: updatedStatus },
      include: enrollmentInclude,
    });

    await this.auditLogsService.log({
      instituteId: currentUser.instituteId,
      userId: currentUser.sub,
      module: 'ENROLLMENT',
      entityId: updated.id,
      action: 'WAITLIST_PROMOTE',
      metadata: { newStatus: updatedStatus },
    });

    return updated;
  }
}
