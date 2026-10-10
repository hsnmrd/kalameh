import { Test, TestingModule } from '@nestjs/testing';
import { StudentExcelService } from './student-excel.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { ROLES, type JwtPayload } from '@workspace/types';

describe('StudentExcelService', () => {
  let service: StudentExcelService;
  let excelService: any;
  let prisma: any;

  const mockCurrentUser: JwtPayload = {
    sub: 'user-1',
    instituteId: 'inst-1',
    role: ROLES.ADMIN,
    phone: '09121111111',
  };

  beforeEach(async () => {
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
});
