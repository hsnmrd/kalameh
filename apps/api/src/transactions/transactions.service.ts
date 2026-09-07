import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import {
  ROLES,
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
} as const;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
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

    return this.prisma.transaction.findMany({
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
  }

  async findOne(id: string, currentUser: JwtPayload): Promise<TransactionDto> {
    return this.prisma.transaction.findFirstOrThrow({
      where: {
        id,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: transactionInclude,
    });
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

    const transaction = await this.prisma.transaction.create({
      data: {
        instituteId: currentUser.instituteId,
        studentId: currentUser.sub,
        amount: dto.amount,
        trackingCode: dto.trackingCode,
        receiptImageUrl,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      },
      include: transactionInclude,
    });

    await this.auditLogsService.log({
      instituteId: currentUser.instituteId,
      userId: currentUser.sub,
      module: 'TRANSACTION',
      entityId: transaction.id,
      action: 'CREATE',
      metadata: {
        amount: transaction.amount,
        trackingCode: transaction.trackingCode,
      },
    });

    return transaction;
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

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'TRANSACTION',
      entityId: updated.id,
      action: 'STATUS_UPDATE',
      metadata: { previousStatus: existing.status, status: updated.status },
    });

    return updated;
  }
}
