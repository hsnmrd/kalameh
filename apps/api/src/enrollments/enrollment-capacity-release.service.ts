import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ENROLLMENT_STATUSES } from '@workspace/types';

@Injectable()
export class EnrollmentCapacityReleaseService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EnrollmentCapacityReleaseService.name);
  private intervalRef: NodeJS.Timeout | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Run capacity cleanup every 2 minutes
    this.intervalRef = setInterval(
      () => {
        this.releaseExpiredReservations().catch((err) => {
          this.logger.error(
            `Error in capacity release interval: ${err.message}`,
          );
        });
      },
      2 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  async releaseExpiredReservations(): Promise<number> {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const expired = await this.prisma.enrollment.findMany({
      where: {
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
        updatedAt: {
          lt: thirtyMinutesAgo,
        },
      },
      select: { id: true, studentId: true, classId: true },
    });

    if (expired.length === 0) return 0;

    // Delete or cancel expired pending payments
    const result = await this.prisma.enrollment.deleteMany({
      where: {
        id: { in: expired.map((e) => e.id) },
        status: ENROLLMENT_STATUSES.PENDING_PAYMENT,
      },
    });

    this.logger.log(
      `Released ${result.count} expired reservations older than 30 minutes.`,
    );

    return result.count;
  }
}
