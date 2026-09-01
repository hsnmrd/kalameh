import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  JwtPayload,
  AuditLogDto,
  CreateAuditLogInput,
  AuditLogFilter,
} from '@workspace/types';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          instituteId: input.instituteId,
          userId: input.userId,
          module: input.module.toUpperCase(),
          entityId: input.entityId,
          action: input.action.toUpperCase(),
          description: input.description ?? null,
          metadata: input.metadata
            ? JSON.parse(JSON.stringify(input.metadata))
            : undefined,
        },
      });
      this.logger.debug(
        `[AuditLog] ${input.module}:${input.action} on ${input.entityId} by user ${input.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to record audit log: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  async findAll(
    currentUser: JwtPayload,
    filter: AuditLogFilter,
  ): Promise<AuditLogDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && filter.instituteId
        ? filter.instituteId
        : currentUser.instituteId;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        ...(currentUser.role === 'SUPER_ADMIN' && !filter.instituteId
          ? {}
          : { instituteId }),
        ...(filter.module ? { module: filter.module.toUpperCase() } : {}),
        ...(filter.entityId ? { entityId: filter.entityId } : {}),
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.action ? { action: filter.action.toUpperCase() } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
    });

    return logs as unknown as AuditLogDto[];
  }

  async findByEntity(
    currentUser: JwtPayload,
    module: string,
    entityId: string,
  ): Promise<AuditLogDto[]> {
    return this.findAll(currentUser, {
      module,
      entityId,
      limit: 100,
      offset: 0,
    });
  }
}
