import { ROLES, type JwtPayload } from '@workspace/types';
import { SchedulingTermsService } from './scheduling-terms.service';

describe('SchedulingTermsService', () => {
  let service: SchedulingTermsService;
  let prisma: any;
  let i18n: any;

  const mockAdminUser: JwtPayload = {
    sub: '00000000-0000-4000-8000-000000000001',
    phone: '09123456789',
    role: ROLES.ADMIN,
    instituteId: '11111111-1111-4000-8000-111111111111',
  };

  const termId = '22222222-2222-4000-8000-222222222222';

  beforeEach(() => {
    prisma = {
      term: {
        findMany: jest.fn(),
      },
    };
    i18n = {
      t: jest.fn((key: string) => key),
    };
    service = new SchedulingTermsService(prisma, i18n);
  });

  it('correctly maps terms with requirements and scheduled plans', async () => {
    prisma.term.findMany.mockResolvedValue([
      {
        id: termId,
        title: 'اردیبهشت ۱۴۰۶',
        startDate: new Date('2027-05-12T00:00:00.000Z'),
        endDate: new Date('2027-06-21T00:00:00.000Z'),
        isActive: true,
        operatingPhase: {
          id: '33333333-3333-4000-8000-333333333333',
          title: 'فاز عمومی',
          slotDurationMinutes: 90,
        },
        classRequirements: [
          { requiredClassCount: 2 },
          { requiredClassCount: 1 },
        ],
        _count: { classes: 4 },
        schedulingRuns: [
          {
            id: '44444444-4444-4000-8000-444444444444',
            status: 'COMPLETED',
            createdAt: new Date('2026-09-23T10:00:00.000Z'),
            plans: [{ id: 'plan-1', status: 'DRAFT', rank: 1 }],
          },
        ],
      },
    ]);

    const result = await service.getTermsSummary(mockAdminUser);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: termId,
      title: 'اردیبهشت ۱۴۰۶',
      requirementsCount: 2,
      totalRequiredClasses: 3,
      classesCount: 4,
      schedulingStatus: 'SCHEDULED',
      latestRun: {
        id: '44444444-4444-4000-8000-444444444444',
        plansCount: 1,
      },
    });
  });

  it('marks terms with no requirements as NO_REQUIREMENTS', async () => {
    prisma.term.findMany.mockResolvedValue([
      {
        id: termId,
        title: 'خرداد ۱۴۰۶',
        startDate: new Date('2027-06-22T00:00:00.000Z'),
        endDate: new Date('2027-07-31T00:00:00.000Z'),
        isActive: true,
        operatingPhase: null,
        classRequirements: [],
        _count: { classes: 0 },
        schedulingRuns: [],
      },
    ]);

    const result = await service.getTermsSummary(mockAdminUser);

    expect(result).toHaveLength(1);
    expect(result[0].schedulingStatus).toBe('NO_REQUIREMENTS');
  });

  it('marks terms with requirements but no run as READY_TO_SCHEDULE', async () => {
    prisma.term.findMany.mockResolvedValue([
      {
        id: termId,
        title: 'تیر ۱۴۰۶',
        startDate: new Date('2027-07-01T00:00:00.000Z'),
        endDate: new Date('2027-08-15T00:00:00.000Z'),
        isActive: true,
        operatingPhase: null,
        classRequirements: [{ requiredClassCount: 1 }],
        _count: { classes: 0 },
        schedulingRuns: [],
      },
    ]);

    const result = await service.getTermsSummary(mockAdminUser);

    expect(result).toHaveLength(1);
    expect(result[0].schedulingStatus).toBe('READY_TO_SCHEDULE');
  });
});
