import { Test, TestingModule } from '@nestjs/testing';
import { CourseExcelService } from './course-excel.service';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { ROLES, type JwtPayload } from '@workspace/types';

describe('CourseExcelService', () => {
  let service: CourseExcelService;
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
        CourseExcelService,
        {
          provide: PrismaService,
          useValue: {
            course: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
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
            generateCourseTemplate: jest
              .fn()
              .mockReturnValue(Buffer.from('template')),
            exportCourses: jest.fn().mockReturnValue(Buffer.from('export')),
            parseCourseRows: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CourseExcelService>(CourseExcelService);
    excelService = module.get<ExcelService>(ExcelService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate course template buffer', () => {
    const buffer = service.generateTemplate('fa');
    expect(buffer).toBeDefined();
    expect(excelService.generateCourseTemplate).toHaveBeenCalledWith('fa');
  });

  it('should export courses to excel buffer', async () => {
    jest.spyOn(prisma.course, 'findMany').mockResolvedValue([
      {
        title: 'انگلیسی A1',
        baseFee: 1500000,
        createdAt: new Date(),
        prerequisite: null,
        _count: { classes: 2, qualifiedTeachers: 3 },
      } as any,
    ]);

    const buffer = await service.exportToExcel(mockCurrentUser, {}, 'fa');
    expect(buffer).toBeDefined();
    expect(excelService.exportCourses).toHaveBeenCalled();
  });

  it('should return error if uploaded buffer is empty', async () => {
    jest.spyOn(excelService, 'parseCourseRows').mockReturnValue([]);

    const result = await service.importFromExcel(
      mockCurrentUser,
      Buffer.from(''),
      'fa',
    );
    expect(result.totalRows).toBe(0);
    expect(result.failedCount).toBe(0);
    expect(result.errors.length).toBe(1);
  });

  it('should import courses and link prerequisites in two passes', async () => {
    jest.spyOn(excelService, 'parseCourseRows').mockReturnValue([
      { title: 'انگلیسی A1', baseFee: 1000000 },
      {
        title: 'انگلیسی A2',
        baseFee: 1200000,
        prerequisiteTitle: 'انگلیسی A1',
      },
    ]);

    jest.spyOn(prisma.course, 'findMany').mockResolvedValue([]);

    jest
      .spyOn(prisma.course, 'create')
      .mockResolvedValueOnce({ id: 'course-1', title: 'انگلیسی A1' } as any)
      .mockResolvedValueOnce({ id: 'course-2', title: 'انگلیسی A2' } as any);

    jest.spyOn(prisma.course, 'update').mockResolvedValue({} as any);

    const result = await service.importFromExcel(
      mockCurrentUser,
      Buffer.from('mock-data'),
      'fa',
    );

    expect(result.totalRows).toBe(2);
    expect(result.importedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(prisma.course.update).toHaveBeenCalledWith({
      where: { id: 'course-2' },
      data: { prerequisiteId: 'course-1' },
    });
  });

  it('should reject duplicate titles in the same file', async () => {
    jest.spyOn(excelService, 'parseCourseRows').mockReturnValue([
      { title: 'انگلیسی A1', baseFee: 1000000 },
      { title: 'انگلیسی A1', baseFee: 1200000 },
    ]);

    jest.spyOn(prisma.course, 'findMany').mockResolvedValue([]);
    jest
      .spyOn(prisma.course, 'create')
      .mockResolvedValue({ id: 'course-1', title: 'انگلیسی A1' } as any);

    const result = await service.importFromExcel(
      mockCurrentUser,
      Buffer.from('mock-data'),
      'fa',
    );

    expect(result.totalRows).toBe(2);
    expect(result.importedCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.errors[0].row).toBe(3);
  });
});
