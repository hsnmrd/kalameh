import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import {
  ENROLLMENT_STATUSES,
  ROLES,
  TRANSACTION_STATUSES,
  type JwtPayload,
  type SupportedLocale,
  type TransactionDto,
} from '@workspace/types';

const transactionInclude = {
  student: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatarUrl: true,
    },
  },
  class: {
    select: {
      id: true,
      title: true,
      fee: true,
      term: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly auditLogsService: AuditLogsService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    filter: TransactionFilterDto,
  ): Promise<TransactionDto[]> {
    const isSuperAdmin = currentUser.role === ROLES.SUPER_ADMIN;
    const instituteId = isSuperAdmin
      ? filter.instituteId
      : currentUser.instituteId;

    const transactions = await this.prisma.transaction.findMany({
      where: {
        ...(instituteId ? { instituteId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.search
          ? {
              OR: [
                {
                  trackingCode: {
                    contains: filter.search,
                    mode: 'insensitive',
                  },
                },
                {
                  student: {
                    OR: [
                      {
                        firstName: {
                          contains: filter.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: filter.search,
                          mode: 'insensitive',
                        },
                      },
                      { phone: { contains: filter.search } },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      include: transactionInclude,
      orderBy: { createdAt: 'desc' },
    });

    const trackingCounts = await this.prisma.transaction.groupBy({
      by: ['trackingCode'],
      where: instituteId ? { instituteId } : {},
      _count: { trackingCode: true },
    });

    const duplicateMap = new Map(
      trackingCounts.map((c) => [c.trackingCode, c._count.trackingCode]),
    );

    return transactions.map((t) => {
      const count = duplicateMap.get(t.trackingCode) ?? 1;
      return {
        ...t,
        isDuplicateTrackingCode: count > 1,
        duplicateCount: count,
      };
    });
  }

  async findOne(id: string, currentUser: JwtPayload): Promise<TransactionDto> {
    const transaction = await this.prisma.transaction.findFirstOrThrow({
      where: {
        id,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: transactionInclude,
    });

    const duplicateCount = await this.prisma.transaction.count({
      where: {
        instituteId: transaction.instituteId,
        trackingCode: transaction.trackingCode,
      },
    });

    return {
      ...transaction,
      isDuplicateTrackingCode: duplicateCount > 1,
      duplicateCount,
    };
  }

  async create(
    currentUser: JwtPayload,
    dto: CreateTransactionDto,
    receiptImageUrl: string,
    locale: SupportedLocale,
  ): Promise<TransactionDto> {
    if (
      currentUser.role !== ROLES.STUDENT &&
      currentUser.role !== ROLES.SUPER_STUDENT
    ) {
      throw new ForbiddenException(
        this.i18n.t('transactions.studentOnly', locale),
      );
    }

    await this.prisma.user.findFirstOrThrow({
      where: {
        id: currentUser.sub,
        instituteId: currentUser.instituteId,
        isActive: true,
      },
    });

    if (dto.classId) {
      const cls = await this.prisma.class.findFirstOrThrow({
        where: {
          id: dto.classId,
          instituteId: currentUser.instituteId,
        },
      });

      if (dto.amount !== cls.fee) {
        throw new BadRequestException(
          locale === 'fa'
            ? `مبلغ پرداختی باید دقیقاً برابر با مبلغ کل شهریه کلاس (${cls.fee}) باشد.`
            : `Payment amount must exactly match the full class tuition (${cls.fee}).`,
        );
      }
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        instituteId: currentUser.instituteId,
        studentId: currentUser.sub,
        classId: dto.classId,
        amount: dto.amount,
        trackingCode: dto.trackingCode,
        receiptImageUrl,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      },
      include: transactionInclude,
    });

    if (dto.classId) {
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
          status: ENROLLMENT_STATUSES.PENDING_APPROVAL,
          transactionId: transaction.id,
        },
        update: {
          status: ENROLLMENT_STATUSES.PENDING_APPROVAL,
          transactionId: transaction.id,
        },
      });

      await this.redis.releaseClassLock(dto.classId, currentUser.sub);
    }

    await this.auditLogsService.log({
      instituteId: currentUser.instituteId,
      userId: currentUser.sub,
      module: 'TRANSACTION',
      entityId: transaction.id,
      action: 'CREATE',
      metadata: {
        amount: transaction.amount,
        trackingCode: transaction.trackingCode,
        classId: dto.classId,
      },
    });

    return {
      ...transaction,
      isDuplicateTrackingCode: false,
      duplicateCount: 1,
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateTransactionStatusDto,
    currentUser: JwtPayload,
  ): Promise<TransactionDto> {
    const existing = await this.findOne(id, currentUser);
    const updated = await this.prisma.transaction.update({
      where: { id, instituteId: existing.instituteId },
      data: { status: dto.status },
      include: transactionInclude,
    });

    if (existing.classId) {
      if (dto.status === TRANSACTION_STATUSES.APPROVED) {
        await this.prisma.enrollment.updateMany({
          where: {
            studentId: existing.studentId,
            classId: existing.classId,
          },
          data: { status: ENROLLMENT_STATUSES.ENROLLED },
        });
      } else if (dto.status === TRANSACTION_STATUSES.REJECTED) {
        await this.prisma.enrollment.updateMany({
          where: {
            studentId: existing.studentId,
            classId: existing.classId,
          },
          data: { status: ENROLLMENT_STATUSES.REJECTED },
        });
      }
    }

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'TRANSACTION',
      entityId: updated.id,
      action: 'STATUS_UPDATE',
      metadata: {
        previousStatus: existing.status,
        status: updated.status,
        classId: existing.classId,
      },
    });

    return {
      ...updated,
      isDuplicateTrackingCode: existing.isDuplicateTrackingCode,
      duplicateCount: existing.duplicateCount,
    };
  }
}
