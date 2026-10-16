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
      term: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      class: {
        count: jest.fn().mockResolvedValue(0),
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

  it('should filter slots for school phase based on schoolShift', async () => {
    prisma.instituteOperatingPhase.findMany.mockResolvedValue([
      {
        id: 'phase-school',
        startTime: '08:00',
        endTime: '17:00',
        slotDurationMinutes: 180, // Slots: 08:00-11:00, 11:00-14:00, 14:00-17:00
        daysOfWeek: ['SATURDAY', 'SUNDAY'],
        hasBreak: false,
        isSchoolCalendarAware: true,
      },
    ]);

    prisma.studentProfile.findMany.mockResolvedValue([
      {
        id: 'prof-morning',
        schoolShift: 'MORNING', // school is morning -> available >= 13:00 -> only 14:00-17:00
        dayPreference: 'ANY',
      },
      {
        id: 'prof-afternoon',
        schoolShift: 'AFTERNOON', // school is afternoon -> available <= 13:00 -> only 08:00-11:00
        dayPreference: 'ANY',
      },
    ]);

    await service.seedImportedStudentsAvailability('inst-1', [
      '09121111111',
      '09122222222',
    ]);

    expect(prisma.studentAvailability.createMany).toHaveBeenCalled();
    const insertedData =
      prisma.studentAvailability.createMany.mock.calls[0][0].data;

    // Check morning shift student slots
    const morningSlots = insertedData.filter(
      (s: any) => s.studentProfileId === 'prof-morning',
    );
    expect(morningSlots.length).toBe(2); // Saturday and Sunday at 14:00-17:00
    expect(morningSlots.every((s: any) => s.startTime === '14:00')).toBe(true);

    // Check afternoon shift student slots
    const afternoonSlots = insertedData.filter(
      (s: any) => s.studentProfileId === 'prof-afternoon',
    );
    expect(afternoonSlots.length).toBe(2); // Saturday and Sunday at 08:00-11:00
    expect(afternoonSlots.every((s: any) => s.startTime === '08:00')).toBe(
      true,
    );

    expect(prisma.studentProfile.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['prof-morning', 'prof-afternoon'] } },
      data: { scheduleStatus: 'COMPLETE' },
    });
  });

  it('should NOT filter school shift when isSchoolCalendarAware is false (Summer Phase)', async () => {
    prisma.instituteOperatingPhase.findMany.mockResolvedValue([
      {
        id: 'phase-summer',
        startTime: '08:00',
        endTime: '12:00',
        slotDurationMinutes: 120, // 08:00-10:00, 10:00-12:00
        daysOfWeek: ['SATURDAY'],
        hasBreak: false,
        isSchoolCalendarAware: false, // Summer phase
      },
    ]);

    prisma.studentProfile.findMany.mockResolvedValue([
      {
        id: 'prof-morning',
        schoolShift: 'MORNING', // normally filtered out in school phase, but allowed in summer!
        dayPreference: 'ANY',
      },
    ]);

    await service.seedImportedStudentsAvailability('inst-1', ['09121111111']);

    expect(prisma.studentAvailability.createMany).toHaveBeenCalled();
    const insertedData =
      prisma.studentAvailability.createMany.mock.calls[0][0].data;
    expect(insertedData.length).toBe(2); // Both 08:00 and 10:00 slots are available in summer
  });

  it('should filter days according to dayPreference', async () => {
    prisma.instituteOperatingPhase.findMany.mockResolvedValue([
      {
        id: 'phase-1',
        startTime: '14:00',
        endTime: '16:00',
        slotDurationMinutes: 120,
        daysOfWeek: ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY'],
        hasBreak: false,
        isSchoolCalendarAware: true,
      },
    ]);

    prisma.studentProfile.findMany.mockResolvedValue([
      {
        id: 'prof-even',
        schoolShift: 'FLEXIBLE',
        dayPreference: 'EVEN_DAYS', // Saturday, Monday
      },
      {
        id: 'prof-odd',
        schoolShift: 'FLEXIBLE',
        dayPreference: 'ODD_DAYS', // Sunday, Tuesday
      },
    ]);

    await service.seedImportedStudentsAvailability('inst-1', [
      '09121111111',
      '09122222222',
    ]);

    const insertedData =
      prisma.studentAvailability.createMany.mock.calls[0][0].data;
    const evenSlots = insertedData.filter(
      (s: any) => s.studentProfileId === 'prof-even',
    );
    const oddSlots = insertedData.filter(
      (s: any) => s.studentProfileId === 'prof-odd',
    );

    expect(evenSlots.map((s: any) => s.dayOfWeek)).toEqual([
      'SATURDAY',
      'MONDAY',
    ]);
    expect(oddSlots.map((s: any) => s.dayOfWeek)).toEqual([
      'SUNDAY',
      'TUESDAY',
    ]);
  });
});
