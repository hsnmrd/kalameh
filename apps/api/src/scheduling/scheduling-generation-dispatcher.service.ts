import {
  ConflictException,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import {
  SchedulingDispatchResultSchema,
  type SchedulingDispatchResult,
} from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingGenerationEngineService } from './scheduling-generation-engine.service';

const DEFAULT_BATCH_SIZE = 5;
const POLL_INTERVAL_MS = 2_000;
const STALE_RUN_TIMEOUT_MS = 30 * 60 * 1_000;

@Injectable()
export class SchedulingGenerationDispatcherService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(
    SchedulingGenerationDispatcherService.name,
  );
  private activeDrain: Promise<SchedulingDispatchResult> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: SchedulingGenerationEngineService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  onApplicationBootstrap(): void {
    this.isRunning = true;
    this.scheduleNextPoll(0);
  }

  onApplicationShutdown(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  wake(): void {
    if (!this.isRunning || this.activeDrain) {
      return;
    }

    this.scheduleNextPoll(0);
  }

  runOnce(
    batchSize = DEFAULT_BATCH_SIZE,
    now = new Date(),
  ): Promise<SchedulingDispatchResult> {
    if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 100) {
      return Promise.reject(
        new RangeError('dispatch batch size must be between 1 and 100'),
      );
    }
    if (Number.isNaN(now.getTime())) {
      return Promise.reject(new RangeError('dispatch time must be valid'));
    }
    if (this.activeDrain) {
      return this.activeDrain;
    }

    this.activeDrain = this.drain(batchSize, now).finally(() => {
      this.activeDrain = null;
    });
    return this.activeDrain;
  }

  private async drain(
    batchSize: number,
    now: Date,
  ): Promise<SchedulingDispatchResult> {
    const requeuedStaleRunCount = await this.requeueStaleRuns(now);
    const queuedRuns = await this.prisma.schedulingRun.findMany({
      where: { status: 'QUEUED' },
      select: { id: true, instituteId: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: batchSize,
    });
    let completedRunCount = 0;
    let failedRunCount = 0;
    let skippedRunCount = 0;

    for (const run of queuedRuns) {
      try {
        await this.engine.process(run.instituteId, run.id, now);
        completedRunCount += 1;
      } catch (error) {
        if (
          error instanceof ConflictException &&
          error.message === 'scheduling run is not queued'
        ) {
          skippedRunCount += 1;
          continue;
        }

        failedRunCount += 1;
        this.logger.error(
          `Scheduling run ${run.id} failed in background generation`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return SchedulingDispatchResultSchema.parse({
      discoveredRunCount: queuedRuns.length,
      completedRunCount,
      failedRunCount,
      skippedRunCount,
      requeuedStaleRunCount,
    });
  }

  private async requeueStaleRuns(now: Date): Promise<number> {
    const staleBefore = new Date(now.getTime() - STALE_RUN_TIMEOUT_MS);
    const staleRuns = await this.prisma.schedulingRun.findMany({
      where: { status: 'GENERATING', startedAt: { lt: staleBefore } },
      select: { id: true, instituteId: true, requestedByUserId: true },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
      take: DEFAULT_BATCH_SIZE,
    });
    let requeuedCount = 0;

    for (const run of staleRuns) {
      const result = await this.prisma.schedulingRun.updateMany({
        where: {
          id: run.id,
          instituteId: run.instituteId,
          status: 'GENERATING',
          startedAt: { lt: staleBefore },
        },
        data: {
          status: 'QUEUED',
          startedAt: null,
          completedAt: null,
          failureCode: null,
          failureMessage: null,
        },
      });
      if (result.count !== 1) {
        continue;
      }

      requeuedCount += 1;
      await this.auditLogsService.log({
        instituteId: run.instituteId,
        userId: run.requestedByUserId,
        module: 'SCHEDULING',
        entityId: run.id,
        action: 'GENERATION_REQUEUED',
        metadata: { reason: 'STALE_GENERATION_TIMEOUT' },
      });
    }

    return requeuedCount;
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.isRunning) {
      return;
    }
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.poll();
    }, delayMs);
    this.timer.unref();
  }

  private async poll(): Promise<void> {
    try {
      await this.runOnce();
    } catch (error) {
      this.logger.error(
        'Scheduling dispatcher polling failed',
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.scheduleNextPoll(POLL_INTERVAL_MS);
    }
  }
}
