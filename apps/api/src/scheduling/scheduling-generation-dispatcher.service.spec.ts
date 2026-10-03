/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { ConflictException, Logger } from '@nestjs/common';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulingGenerationDispatcherService } from './scheduling-generation-dispatcher.service';
import { SchedulingGenerationEngineService } from './scheduling-generation-engine.service';

describe('MVP-027 SchedulingGenerationDispatcherService', () => {
  const uuid = (suffix: number): string =>
    `00000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`;
  const ids = {
    institute: uuid(1),
    secondInstitute: uuid(2),
    run: uuid(3),
    secondRun: uuid(4),
    requester: uuid(5),
  };
  const now = new Date('2026-09-09T12:00:00.000Z');
  let prisma: any;
  let engine: any;
  let auditLogs: any;
  let service: SchedulingGenerationDispatcherService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    prisma = {
      schedulingRun: {
        findMany: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    engine = { process: jest.fn().mockResolvedValue({ status: 'COMPLETED' }) };
    auditLogs = { log: jest.fn().mockResolvedValue(undefined) };
    service = new SchedulingGenerationDispatcherService(
      prisma as PrismaService,
      engine as SchedulingGenerationEngineService,
      auditLogs as AuditLogsService,
    );
  });

  afterEach(() => {
    service.onApplicationShutdown();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('processes queued runs in a bounded batch and isolates run failures', async () => {
    prisma.schedulingRun.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: ids.run, instituteId: ids.institute },
        { id: ids.secondRun, instituteId: ids.secondInstitute },
      ]);
    engine.process
      .mockResolvedValueOnce({ status: 'COMPLETED' })
      .mockRejectedValueOnce(new Error('generation failed'));

    const result = await service.runOnce(2, now);

    expect(result).toEqual({
      discoveredRunCount: 2,
      completedRunCount: 1,
      failedRunCount: 1,
      skippedRunCount: 0,
      requeuedStaleRunCount: 0,
    });
    expect(engine.process.mock.calls).toEqual([
      [ids.institute, ids.run, now],
      [ids.secondInstitute, ids.secondRun, now],
    ]);
    expect(prisma.schedulingRun.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { status: 'QUEUED' }, take: 2 }),
    );
  });

  it('treats an atomically claimed run as skipped instead of failed', async () => {
    prisma.schedulingRun.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: ids.run, instituteId: ids.institute }]);
    engine.process.mockRejectedValue(
      new ConflictException('scheduling run is not queued'),
    );

    await expect(service.runOnce(1, now)).resolves.toMatchObject({
      completedRunCount: 0,
      failedRunCount: 0,
      skippedRunCount: 1,
    });
  });

  it('requeues stale generating runs with a tenant-scoped guard', async () => {
    prisma.schedulingRun.findMany
      .mockResolvedValueOnce([
        {
          id: ids.run,
          instituteId: ids.institute,
          requestedByUserId: ids.requester,
        },
      ])
      .mockResolvedValueOnce([{ id: ids.run, instituteId: ids.institute }]);

    const result = await service.runOnce(1, now);

    expect(result.requeuedStaleRunCount).toBe(1);
    expect(prisma.schedulingRun.updateMany).toHaveBeenCalledWith({
      where: {
        id: ids.run,
        instituteId: ids.institute,
        status: 'GENERATING',
        startedAt: { lt: new Date('2026-09-09T11:30:00.000Z') },
      },
      data: expect.objectContaining({ status: 'QUEUED', startedAt: null }),
    });
    expect(auditLogs.log).toHaveBeenCalledWith(
      expect.objectContaining({
        instituteId: ids.institute,
        entityId: ids.run,
        action: 'GENERATION_REQUEUED',
      }),
    );
    expect(engine.process).toHaveBeenCalledWith(ids.institute, ids.run, now);
  });

  it('coalesces overlapping local drain requests', async () => {
    let releaseEngine: (() => void) | undefined;
    const engineResult = new Promise<void>((resolve) => {
      releaseEngine = resolve;
    });
    prisma.schedulingRun.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: ids.run, instituteId: ids.institute }]);
    engine.process.mockReturnValue(engineResult);

    const first = service.runOnce(1, now);
    const second = service.runOnce(1, now);
    releaseEngine?.();

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(prisma.schedulingRun.findMany).toHaveBeenCalledTimes(2);
    expect(engine.process).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid worker controls before querying the queue', async () => {
    await expect(service.runOnce(0, now)).rejects.toThrow(RangeError);
    await expect(service.runOnce(1, new Date('invalid'))).rejects.toThrow(
      RangeError,
    );
    expect(prisma.schedulingRun.findMany).not.toHaveBeenCalled();
  });

  it('starts polling on bootstrap and stops polling on shutdown', async () => {
    jest.useFakeTimers();
    prisma.schedulingRun.findMany.mockResolvedValue([]);

    service.onApplicationBootstrap();
    await jest.advanceTimersByTimeAsync(0);

    expect(prisma.schedulingRun.findMany).toHaveBeenCalledTimes(2);
    service.onApplicationShutdown();
    await jest.advanceTimersByTimeAsync(2_000);
    expect(prisma.schedulingRun.findMany).toHaveBeenCalledTimes(2);
  });
});
