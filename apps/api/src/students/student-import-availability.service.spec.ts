import { Test, TestingModule } from '@nestjs/testing';
import { StudentImportAvailabilityService } from './student-import-availability.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StudentImportAvailabilityService', () => {
  let service: StudentImportAvailabilityService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      instituteOperatingPhase: {
        findMany: jest.fn(),
      },
      studentProfile: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      studentAvailability: {
        createMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentImportAvailabilityService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StudentImportAvailabilityService>(
      StudentImportAvailabilityService,
    );
  });

  it('should return early if phones list is empty', async () => {
    await service.seedImportedStudentsAvailability('inst-1', []);
    expect(prisma.instituteOperatingPhase.findMany).not.toHaveBeenCalled();
  });

  it('should return early if no active operating phases exist', async () => {
    prisma.instituteOperatingPhase.findMany.mockResolvedValue([]);
    await service.seedImportedStudentsAvailability('inst-1', ['09121111111']);
    expect(prisma.studentProfile.findMany).not.toHaveBeenCalled();
  });

  it('should seed availabilities when active phases and student profiles exist', async () => {
    prisma.instituteOperatingPhase.findMany.mockResolvedValue([
      {
        id: 'phase-1',
        startTime: '08:00',
        endTime: '12:00',
        slotDurationMinutes: 120,
        daysOfWeek: ['SATURDAY', 'MONDAY'],
        hasBreak: false,
      },
    ]);

    prisma.studentProfile.findMany.mockResolvedValue([
      { id: 'profile-1' },
      { id: 'profile-2' },
    ]);

    await service.seedImportedStudentsAvailability('inst-1', [
      '09121111111',
      '09122222222',
    ]);

    expect(prisma.studentAvailability.createMany).toHaveBeenCalled();
    expect(prisma.studentProfile.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['profile-1', 'profile-2'] } },
      data: { scheduleStatus: 'COMPLETE' },
    });
  });
});
