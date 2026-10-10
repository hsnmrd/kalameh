import { Test, TestingModule } from '@nestjs/testing';
import { TeacherExcelService } from './teacher-excel.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { ROLES, type JwtPayload } from '@workspace/types';

describe('TeacherExcelService', () => {
  let service: TeacherExcelService;
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
        TeacherExcelService,
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
            generateTeacherTemplate: jest
              .fn()
              .mockReturnValue(Buffer.from('template')),
            exportTeachers: jest.fn().mockReturnValue(Buffer.from('export')),
            parseTeacherRows: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeacherExcelService>(TeacherExcelService);
    excelService = module.get<ExcelService>(ExcelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate teacher template buffer', () => {
    const buffer = service.generateTemplate('fa');
    expect(buffer).toBeDefined();
    expect(excelService.generateTeacherTemplate).toHaveBeenCalledWith('fa');
  });

  it('should export teachers to excel buffer', async () => {
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
      {
        firstName: 'Ali',
        lastName: 'Ahmadi',
        phone: '09121111111',
        nationalCode: '0012345678',
        isActive: true,
        createdAt: new Date(),
        teacherProfile: { degree: 'Master' },
        teachingClasses: [{ id: 'class-1' }],
      } as any,
    ]);

    const buffer = await service.exportToExcel(mockCurrentUser, {}, 'fa');
    expect(buffer).toBeDefined();
    expect(excelService.exportTeachers).toHaveBeenCalled();
  });

  it('should return error if uploaded buffer is empty', async () => {
    jest.spyOn(excelService, 'parseTeacherRows').mockReturnValue([]);

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
