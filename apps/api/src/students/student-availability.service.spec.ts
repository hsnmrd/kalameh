import { Test, TestingModule } from '@nestjs/testing';
import { ROLES, type JwtPayload } from '@workspace/types';
import { StudentAvailabilityService } from './student-availability.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('StudentAvailabilityService', () => {
  let service: StudentAvailabilityService;

  const mockPrisma = {
    user: {
      findFirstOrThrow: jest.fn(),
      findMany: jest.fn(),
    },
    instituteOperatingPhase: {
      findFirstOrThrow: jest.fn(),
    },
    studentProfile: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    studentAvailability: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockAuditLogs = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const currentUser: JwtPayload = {
    sub: 'user-operator-1',
    role: ROLES.ADMIN,
    instituteId: 'inst-1',
    phone: '09121111111',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentAvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogsService, useValue: mockAuditLogs },
      ],
    }).compile();

    service = module.get<StudentAvailabilityService>(
      StudentAvailabilityService,
    );
  });

  describe('getAvailabilities', () => {
    it('returns empty array when student has no studentProfile', async () => {
      mockPrisma.user.findFirstOrThrow.mockResolvedValue({
        id: 'student-1',
        role: ROLES.STUDENT,
        instituteId: 'inst-1',
        studentProfile: null,
      });

      const result = await service.getAvailabilities(currentUser, 'student-1');
      expect(result).toEqual([]);
      expect(mockPrisma.studentAvailability.findMany).not.toHaveBeenCalled();
    });

    it('returns student availabilities ordered by day and start time', async () => {
      mockPrisma.user.findFirstOrThrow.mockResolvedValue({
        id: 'student-1',
        role: ROLES.STUDENT,
        instituteId: 'inst-1',
        studentProfile: { id: 'profile-1' },
      });
      mockPrisma.studentAvailability.findMany.mockResolvedValue([
        {
          id: 'slot-1',
          studentProfileId: 'profile-1',
          operatingPhaseId: 'phase-1',
          dayOfWeek: 'SATURDAY',
          startTime: '15:00',
          endTime: '16:30',
        },
      ]);

      const result = await service.getAvailabilities(
        currentUser,
        'student-1',
        'phase-1',
      );

      expect(mockPrisma.studentAvailability.findMany).toHaveBeenCalledWith({
        where: {
          studentProfileId: 'profile-1',
          operatingPhaseId: 'phase-1',
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('updateAvailabilities', () => {
    it('saves new availabilities and updates scheduleStatus to COMPLETE', async () => {
      mockPrisma.user.findFirstOrThrow.mockResolvedValue({
        id: 'student-1',
        role: ROLES.STUDENT,
        instituteId: 'inst-1',
        studentProfile: { id: 'profile-1' },
      });
      mockPrisma.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue({
        id: 'phase-1',
        instituteId: 'inst-1',
      });
      mockPrisma.studentAvailability.count.mockResolvedValue(2);
      mockPrisma.studentAvailability.findMany.mockResolvedValue([
        {
          id: 'av-1',
          studentProfileId: 'profile-1',
          operatingPhaseId: 'phase-1',
          dayOfWeek: 'SATURDAY',
          startTime: '15:00',
          endTime: '16:30',
        },
        {
          id: 'av-2',
          studentProfileId: 'profile-1',
          operatingPhaseId: 'phase-1',
          dayOfWeek: 'MONDAY',
          startTime: '15:00',
          endTime: '16:30',
        },
      ]);

      const result = await service.updateAvailabilities(
        currentUser,
        'student-1',
        {
          operatingPhaseId: 'phase-1',
          availabilities: [
            { dayOfWeek: 'SATURDAY', startTime: '15:00', endTime: '16:30' },
            { dayOfWeek: 'MONDAY', startTime: '15:00', endTime: '16:30' },
          ],
        },
      );

      expect(mockPrisma.studentAvailability.deleteMany).toHaveBeenCalledWith({
        where: {
          studentProfileId: 'profile-1',
          operatingPhaseId: 'phase-1',
        },
      });
      expect(mockPrisma.studentAvailability.createMany).toHaveBeenCalledWith({
        data: [
          {
            studentProfileId: 'profile-1',
            operatingPhaseId: 'phase-1',
            dayOfWeek: 'SATURDAY',
            startTime: '15:00',
            endTime: '16:30',
          },
          {
            studentProfileId: 'profile-1',
            operatingPhaseId: 'phase-1',
            dayOfWeek: 'MONDAY',
            startTime: '15:00',
            endTime: '16:30',
          },
        ],
      });
      expect(mockPrisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: { scheduleStatus: 'COMPLETE' },
      });
      expect(mockAuditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteId: 'inst-1',
          userId: 'user-operator-1',
          module: 'STUDENT',
          action: 'STUDENT_AVAILABILITY_UPDATED',
          entityId: 'student-1',
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('sets scheduleStatus to INCOMPLETE when all availabilities are cleared', async () => {
      mockPrisma.user.findFirstOrThrow.mockResolvedValue({
        id: 'student-1',
        role: ROLES.STUDENT,
        instituteId: 'inst-1',
        studentProfile: { id: 'profile-1' },
      });
      mockPrisma.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue({
        id: 'phase-1',
        instituteId: 'inst-1',
      });
      mockPrisma.studentAvailability.count.mockResolvedValue(0);
      mockPrisma.studentAvailability.findMany.mockResolvedValue([]);

      const result = await service.updateAvailabilities(
        currentUser,
        'student-1',
        {
          operatingPhaseId: 'phase-1',
          availabilities: [],
        },
      );

      expect(mockPrisma.studentAvailability.createMany).not.toHaveBeenCalled();
      expect(mockPrisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: { scheduleStatus: 'INCOMPLETE' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('setAllStudentsAvailable', () => {
    const phaseMock = {
      id: 'phase-1',
      instituteId: 'inst-1',
      startTime: '08:00',
      endTime: '11:00',
      slotDurationMinutes: 90,
      daysOfWeek: ['SATURDAY', 'SUNDAY'],
      hasBreak: false,
      breakStartTime: null,
      breakEndTime: null,
    };

    it('returns zero counts when there are no students', async () => {
      mockPrisma.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue(
        phaseMock,
      );
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.setAllStudentsAvailable(currentUser, {
        operatingPhaseId: 'phase-1',
      });

      expect(result).toEqual({
        success: true,
        studentCount: 0,
        slotsPerStudent: 0,
      });
      expect(mockPrisma.studentAvailability.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.studentAvailability.createMany).not.toHaveBeenCalled();
    });

    it('creates availabilities for all students and updates scheduleStatus to COMPLETE', async () => {
      mockPrisma.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue(
        phaseMock,
      );
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'student-1',
          instituteId: 'inst-1',
          studentProfile: { id: 'profile-1' },
        },
        {
          id: 'student-2',
          instituteId: 'inst-1',
          studentProfile: { id: 'profile-2' },
        },
      ]);

      const result = await service.setAllStudentsAvailable(currentUser, {
        operatingPhaseId: 'phase-1',
      });

      // 08:00 to 11:00 with 90 min slot => 2 slots: [08:00-09:30, 09:30-11:00]
      // 2 days * 2 slots = 4 slots per student
      expect(result).toEqual({
        success: true,
        studentCount: 2,
        slotsPerStudent: 4,
      });

      expect(mockPrisma.studentAvailability.deleteMany).toHaveBeenCalledWith({
        where: {
          studentProfileId: { in: ['profile-1', 'profile-2'] },
          operatingPhaseId: 'phase-1',
        },
      });

      expect(mockPrisma.studentAvailability.createMany).toHaveBeenCalledTimes(
        1,
      );
      const createdSlots =
        mockPrisma.studentAvailability.createMany.mock.calls[0][0].data;
      expect(createdSlots).toHaveLength(8); // 2 students * 4 slots each

      expect(mockPrisma.studentProfile.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['profile-1', 'profile-2'] },
        },
        data: {
          scheduleStatus: 'COMPLETE',
        },
      });

      expect(mockAuditLogs.log).toHaveBeenCalledWith(
        expect.objectContaining({
          instituteId: 'inst-1',
          userId: 'user-operator-1',
          module: 'STUDENT',
          action: 'ALL_STUDENTS_AVAILABILITY_SET',
          entityId: 'phase-1',
          metadata: {
            operatingPhaseId: 'phase-1',
            studentCount: 2,
            slotsPerStudent: 4,
          },
        }),
      );
    });

    it('creates studentProfile for students missing profile', async () => {
      mockPrisma.instituteOperatingPhase.findFirstOrThrow.mockResolvedValue(
        phaseMock,
      );
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'student-no-profile',
          instituteId: 'inst-1',
          studentProfile: null,
        },
      ]);
      mockPrisma.studentProfile.create.mockResolvedValue({
        id: 'created-profile-1',
      });

      const result = await service.setAllStudentsAvailable(currentUser, {
        operatingPhaseId: 'phase-1',
      });

      expect(mockPrisma.studentProfile.create).toHaveBeenCalledWith({
        data: { userId: 'student-no-profile' },
      });
      expect(result.studentCount).toBe(1);
      expect(result.slotsPerStudent).toBe(4);
    });
  });
});
