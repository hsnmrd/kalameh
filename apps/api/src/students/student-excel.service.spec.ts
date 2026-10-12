import { Test, TestingModule } from '@nestjs/testing';
import { StudentExcelService } from './student-excel.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { StudentImportAvailabilityService } from './student-import-availability.service';
import { ROLES, type JwtPayload } from '@workspace/types';

describe('StudentExcelService', () => {
  let service: StudentExcelService;
  let excelService: any;
  let prisma: any;
  let importAvailabilityService: any;

  const mockCurrentUser: JwtPayload = {
    sub: 'user-1',
    instituteId: 'inst-1',
    role: ROLES.ADMIN,
    phone: '09121111111',
  };

  beforeEach(async () => {
    importAvailabilityService = {
      seedImportedStudentsAvailability: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentExcelService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            course: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            branch: {
              findMany: jest.fn().mockResolvedValue([]),
            },
            $transaction: jest
              .fn()
              .mockImplementation((promises) => Promise.all(promises)),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockReturnValue('translated'),
          },
        },
        {
          provide: ExcelService,
          useValue: {
            generateStudentTemplate: jest
              .fn()
              .mockReturnValue(Buffer.from('template')),
            exportStudents: jest.fn().mockReturnValue(Buffer.from('export')),
            parseStudentRows: jest.fn(),
          },
        },
        {
          provide: StudentImportAvailabilityService,
          useValue: importAvailabilityService,
        },
      ],
    }).compile();

    service = module.get<StudentExcelService>(StudentExcelService);
    excelService = module.get<ExcelService>(ExcelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate student template buffer', () => {
    const buffer = service.generateTemplate('fa');
    expect(buffer).toBeDefined();
    expect(excelService.generateStudentTemplate).toHaveBeenCalledWith('fa');
  });

  it('should export students to excel buffer', async () => {
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
      {
        firstName: 'Parsa',
        lastName: 'Rostami',
        phone: '09121111111',
        nationalCode: '0012345678',
        isActive: true,
        createdAt: new Date(),
        studentProfile: {
          fatherName: 'Mahmoud',
          emergencyPhone: '09123333333',
          scheduleStatus: 'COMPLETE',
        },
        currentAllowedCourse: { title: 'Level A1' },
      } as any,
    ]);

    const buffer = await service.exportToExcel(mockCurrentUser, {}, 'fa');
    expect(buffer).toBeDefined();
    expect(excelService.exportStudents).toHaveBeenCalled();
  });

  it('should return error if uploaded buffer is empty', async () => {
    jest.spyOn(excelService, 'parseStudentRows').mockReturnValue([]);

    const result = await service.importFromExcel(
      mockCurrentUser,
      Buffer.from(''),
      'fa',
    );
    expect(result.totalRows).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.errors.length).toBe(1);
  });

  it('should import students with Persian dates, gender, and matched course/branch', async () => {
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
    jest
      .spyOn(prisma.course, 'findMany')
      .mockResolvedValue([{ id: 'course-1', title: 'انگلیسی مقدماتی A1' }]);
    jest
      .spyOn(prisma.branch, 'findMany')
      .mockResolvedValue([{ id: 'branch-1', name: 'شعبه مرکزی' }]);
    jest.spyOn(prisma.user, 'create').mockResolvedValue({ id: 'user-created' });

    jest.spyOn(excelService, 'parseStudentRows').mockReturnValue([
      {
        firstName: 'پارسا',
        lastName: 'رستمی',
        phone: '09121111111',
        nationalCode: '0012345678',
        currentAllowedCourseTitle: 'انگليسی مقدماتی A1',
        branchName: 'شعبه مركزی',
        gender: 'پسر',
        birthDate: '1385/04/15',
        schoolShift: 'صبح',
        dayPreference: 'روزهای زوج',
      },
    ]);

    const result = await service.importFromExcel(
      mockCurrentUser,
      Buffer.from('dummy'),
      'fa',
    );

    expect(result.totalRows).toBe(1);
    expect(result.importedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: 'پارسا',
          lastName: 'رستمی',
          phone: '09121111111',
          branchId: 'branch-1',
          currentAllowedCourseId: 'course-1',
          studentProfile: expect.objectContaining({
            create: expect.objectContaining({
              gender: 'MALE',
              schoolShift: 'MORNING',
              dayPreference: 'EVEN_DAYS',
            }),
          }),
        }),
      }),
    );
    expect(
      importAvailabilityService.seedImportedStudentsAvailability,
    ).toHaveBeenCalledWith('inst-1', ['09121111111']);
  });
});
