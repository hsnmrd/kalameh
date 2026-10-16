import { BadRequestException } from '@nestjs/common';
import { ROLES, type JwtPayload } from '@workspace/types';
import { SchedulingPlanReassignmentApplyService } from './scheduling-plan-reassignment-apply.service';

describe('SchedulingPlanReassignmentApplyService', () => {
  const currentUser: JwtPayload = {
    sub: '11111111-1111-4111-8111-111111111111',
    instituteId: '22222222-2222-4222-8222-222222222222',
    role: ROLES.ADMIN,
    phone: '09121111111',
  };

  const createService = () => {
    const transactionMock = {
      teacherCourseQualification: {
        findFirst: jest.fn().mockResolvedValue({ id: 'qual-1' }),
      },
      schedulingProposal: {
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({ id: 'new-prop-1' }),
      },
      schedulingUnresolvedRequirement: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'unres-1',
          missingClassCount: 1,
          classRequirement: {
            id: 'req-1',
            courseId: 'course-1',
            branchId: 'branch-1',
            capacity: 15,
            course: { title: 'American English File 4-1' },
          },
        }),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      schedulingPlan: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const prisma = {
      schedulingPlan: {
        findFirstOrThrow: jest.fn().mockResolvedValue({
          id: 'plan-1',
          runId: 'run-1',
          firstReviewStartedAt: null,
        }),
      },
      schedulingProposal: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '33333333-3333-4333-8333-333333333333',
            courseId: 'course-other',
          },
        ]),
      },
      $transaction: jest.fn((cb) => cb(transactionMock)),
    };

    const auditLogsService = {
      log: jest.fn().mockResolvedValue({}),
    };
    const i18n = {
      t: jest.fn((key: string) => key),
    };
    const planQueryService = {
      findOne: jest.fn().mockResolvedValue({ id: 'plan-1' }),
    };

    const service = new SchedulingPlanReassignmentApplyService(
      prisma as never,
      auditLogsService as never,
      i18n as never,
      planQueryService as never,
    );

    return {
      service,
      prisma,
      transactionMock,
      auditLogsService,
      planQueryService,
    };
  };

  it('applies reassignment chain steps and creates proposal for target unresolved requirement', async () => {
    const { service, transactionMock, auditLogsService, planQueryService } =
      createService();

    const result = await service.apply(currentUser, 'plan-1', {
      chainKey: 'chain-1',
      unresolvedRequirementId: '44444444-4444-4444-8444-444444444444',
      reassignments: [
        {
          proposalId: '33333333-3333-4333-8333-333333333333',
          toTeacherId: '66666666-6666-4666-8666-666666666666',
        },
      ],
      targetAssignment: {
        teacherId: '55555555-5555-4555-8555-555555555555',
        classroomId: '77777777-7777-4777-8777-777777777777',
        deliveryMode: 'IN_PERSON',
        daysOfWeek: ['SATURDAY', 'MONDAY', 'WEDNESDAY'],
        startTime: '16:30',
        endTime: '18:00',
      },
    });

    expect(result).toEqual({ id: 'plan-1' });
    expect(transactionMock.schedulingProposal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: '33333333-3333-4333-8333-333333333333' },
        data: expect.objectContaining({
          teacherId: '66666666-6666-4666-8666-666666666666',
          teacherQualificationId: 'qual-1',
          isManuallyEdited: true,
        }),
      }),
    );
    expect(transactionMock.schedulingProposal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          teacherId: '55555555-5555-4555-8555-555555555555',
          classroomId: '77777777-7777-4777-8777-777777777777',
          title: 'American English File 4-1',
        }),
      }),
    );
    expect(
      transactionMock.schedulingUnresolvedRequirement.delete,
    ).toHaveBeenCalledWith({
      where: { id: 'unres-1' },
    });
    expect(auditLogsService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REASSIGNMENT_CHAIN_APPLIED',
      }),
    );
    expect(planQueryService.findOne).toHaveBeenCalled();
  });

  it('throws BadRequestException if a proposal in the chain is missing', async () => {
    const { service, prisma } = createService();
    prisma.schedulingProposal.findMany.mockResolvedValueOnce([]);

    await expect(
      service.apply(currentUser, 'plan-1', {
        chainKey: 'chain-1',
        reassignments: [
          {
            proposalId: '33333333-3333-4333-8333-333333333333',
            toTeacherId: '66666666-6666-4666-8666-666666666666',
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
