import { ExcelService } from './excel.service';
import { I18nService } from '../../i18n/i18n.service';
import { parseBirthDate, resolveBranchId } from './student-workbook';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(() => {
    const i18nService = new I18nService();
    service = new ExcelService(i18nService);
  });

  it('should normalize Persian and Arabic digits to English digits', () => {
    expect(service.normalizeDigits('۰۹۱۲۳۴۵۶۷۸۹')).toBe('09123456789');
    expect(service.normalizeDigits('٠٩١٢٣٤٥٦٧٨٩')).toBe('09123456789');
    expect(service.normalizeDigits('  09121234567  ')).toBe('09121234567');
  });

  it('should map localized Persian roles to Role keys', () => {
    expect(service.mapRole('مدرس')).toBe('TEACHER');
    expect(service.mapRole('منشی')).toBe('CLERK');
    expect(service.mapRole('مدیر')).toBe('ADMIN');
    expect(service.mapRole('سرپرست')).toBe('SUPERVISOR');
    expect(service.mapRole('TEACHER')).toBe('TEACHER');
  });

  it('should generate a valid XLSX buffer with PK zip signature', () => {
    const buffer = service.generateUserTemplate('fa');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);
    // ZIP local file signature: 0x50, 0x4B, 0x03, 0x04
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  });

  it('should parse user rows from generated XLSX template buffer', () => {
    const buffer = service.generateUserTemplate('fa');
    const rows = service.parseUserRows(buffer, 'fa');

    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].firstName).toBe('علی');
    expect(rows[0].lastName).toBe('محمدی');
    expect(rows[0].phone).toBe('09121111111');
    expect(rows[0].role).toBe('TEACHER');
  });

  it('should parse CSV formatted text buffer with Persian headers', () => {
    const csvContent =
      'نام,نام خانوادگی,شماره موبایل,کد ملی,نقش کاربری,شعبه,رمز عبور\nزهرا,رضایی,۰۹۱۲۹۹۹۹۹۹۹,۰۰۱۱۱۱۱۱۱۱,مدرس,شعبه شرق,pass123';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const rows = service.parseUserRows(buffer, 'fa');

    expect(rows.length).toBe(1);
    expect(rows[0].firstName).toBe('زهرا');
    expect(rows[0].lastName).toBe('رضایی');
    expect(rows[0].phone).toBe('09129999999');
    expect(rows[0].nationalCode).toBe('0011111111');
    expect(rows[0].role).toBe('TEACHER');
    expect(rows[0].branchName).toBe('شعبه شرق');
    expect(rows[0].password).toBe('pass123');
  });

  it('should generate a valid XLSX export buffer for users list', () => {
    const mockUsers = [
      {
        firstName: 'مهدی',
        lastName: 'کرمی',
        phone: '09124445566',
        nationalCode: '0019998877',
        role: 'TEACHER' as const,
        isActive: true,
        createdAt: new Date(),
      },
    ];

    const buffer = service.exportUsers(mockUsers, 'fa');
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);

    const parsed = service.parseUserRows(buffer, 'fa');
    expect(parsed.length).toBe(1);
    expect(parsed[0].firstName).toBe('مهدی');
    expect(parsed[0].lastName).toBe('کرمی');
    expect(parsed[0].phone).toBe('09124445566');
  });

  it('should normalize Arabic characters and clean spaces in teacher rows', () => {
    // Header with Arabic kaf and yeh: "نام خانوادگى", "شماره موبايل", "دوره های قابل تدريس"
    const csvContent =
      'نام,نام خانوادگى,شماره موبايل,كد ملى,دوره های قابل تدريس,شعبه\nعلى,رضائى,۰۹۱۲۳۴۵۶۷۸۹,۰۰۱۲۳۴۵۶۷۸,انگليسى مقدماتى A1,شعبه مركزى';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const rows = service.parseTeacherRows(buffer, 'fa');

    expect(rows.length).toBe(1);
    expect(rows[0].firstName).toBe('علی');
    expect(rows[0].lastName).toBe('رضائی');
    expect(rows[0].phone).toBe('09123456789');
    expect(rows[0].nationalCode).toBe('0012345678');
    expect(rows[0].teachableCourses).toEqual(['انگلیسی مقدماتی A1']);
    expect(rows[0].branchName).toBe('شعبه مرکزی');
  });

  it('should normalize Arabic characters and shift/day preferences in student rows', () => {
    const csvContent =
      'نام,نام خانوادگى,شماره موبايل,سطح / دوره مجاز,شيفت مدرسه,ترجيح روز,شعبه\nپارسا,رستمى,۰۹۱۲۱۱۱۱۱۱۱,انگليسى A1,صبح,روزهای زوج,شعبه مركزى';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const rows = service.parseStudentRows(buffer, 'fa');

    expect(rows.length).toBe(1);
    expect(rows[0].firstName).toBe('پارسا');
    expect(rows[0].lastName).toBe('رستمی');
    expect(rows[0].currentAllowedCourseTitle).toBe('انگلیسی A1');
    expect(rows[0].schoolShift).toBe('صبح');
    expect(rows[0].dayPreference).toBe('روزهای زوج');
    expect(rows[0].branchName).toBe('شعبه مرکزی');
  });

  it('should normalize Arabic characters in course rows', () => {
    const csvContent =
      'عنوان دوره,شهریه پایه (تومان),پيش‌نياز\nانگليسى مقدماتى A2,"۱,۶۵۰,۰۰۰",انگليسى مقدماتى A1';
    const buffer = Buffer.from(csvContent, 'utf-8');
    const rows = service.parseCourseRows(buffer, 'fa');

    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe('انگلیسی مقدماتی A2');
    expect(rows[0].baseFee).toBe(1650000);
    expect(rows[0].prerequisiteTitle).toBe('انگلیسی مقدماتی A1');
  });

  describe('parseBirthDate', () => {
    it('should parse Persian/Arabic digits Jalali date into standard UTC Date', () => {
      const date = parseBirthDate('۱۳۸۸/۰۴/۱۵');
      expect(date).toBeDefined();
      expect(date?.toISOString()).toBe('2009-07-06T00:00:00.000Z');
    });

    it('should parse Latin digits Jalali date into standard UTC Date', () => {
      const date = parseBirthDate('1388/04/15');
      expect(date).toBeDefined();
      expect(date?.toISOString()).toBe('2009-07-06T00:00:00.000Z');
    });

    it('should support alternative delimiters (hyphen and dot) in Jalali dates', () => {
      const hyphenDate = parseBirthDate('1386-11-20');
      expect(hyphenDate).toBeDefined();
      expect(hyphenDate?.toISOString()).toBe('2008-02-09T00:00:00.000Z');

      const dotDate = parseBirthDate('1370.01.01');
      expect(dotDate).toBeDefined();
      expect(dotDate?.toISOString()).toBe('1991-03-21T00:00:00.000Z');
    });

    it('should parse single digit month and day in Jalali dates', () => {
      const date = parseBirthDate('1370/1/1');
      expect(date).toBeDefined();
      expect(date?.toISOString()).toBe('1991-03-21T00:00:00.000Z');
    });

    it('should parse Gregorian dates with year > 1700 into standard UTC Date', () => {
      const dateDash = parseBirthDate('2009-07-06');
      expect(dateDash).toBeDefined();
      expect(dateDash?.toISOString()).toBe('2009-07-06T00:00:00.000Z');

      const dateSlash = parseBirthDate('2009/07/06');
      expect(dateSlash).toBeDefined();
      expect(dateSlash?.toISOString()).toBe('2009-07-06T00:00:00.000Z');
    });

    it('should parse full ISO timestamp strings', () => {
      const isoDate = parseBirthDate('2009-07-06T00:00:00.000Z');
      expect(isoDate).toBeDefined();
      expect(isoDate?.toISOString()).toBe('2009-07-06T00:00:00.000Z');
    });

    it('should return undefined for empty, whitespace, or invalid dates', () => {
      expect(parseBirthDate('')).toBeUndefined();
      expect(parseBirthDate('   ')).toBeUndefined();
      expect(parseBirthDate(undefined)).toBeUndefined();
      expect(parseBirthDate('invalid-date')).toBeUndefined();
      expect(parseBirthDate('1200/01/01')).toBeUndefined();
    });
  });

  describe('resolveBranchId', () => {
    const branchMap = new Map([
      ['شعبه مرکزی', 'branch-1'],
      ['شعبه غرب', 'branch-2'],
    ]);
    const validBranchNames = 'شعبه مرکزی، شعبه غرب';

    it('should resolve branchId when branchName exists and matches', () => {
      const result = resolveBranchId(
        'شعبه مرکزی',
        branchMap,
        undefined,
        validBranchNames,
        'fa',
      );
      expect(result).toEqual({ branchId: 'branch-1' });
    });

    it('should return error when branchName does not match any valid branch', () => {
      const result = resolveBranchId(
        'شعبه شرق',
        branchMap,
        'branch-1',
        validBranchNames,
        'fa',
      );
      expect(result.branchId).toBeUndefined();
      expect(result.error).toBe(
        'شعبه‌ای با نام "شعبه شرق" یافت نشد. شعب مجاز: شعبه مرکزی، شعبه غرب',
      );
    });

    it('should use fallbackBranchId when branchName is not provided', () => {
      const result = resolveBranchId(
        undefined,
        branchMap,
        'branch-fallback',
        validBranchNames,
        'fa',
      );
      expect(result).toEqual({ branchId: 'branch-fallback' });
    });

    it('should return undefined when branchName is not provided and no fallback exists', () => {
      const result = resolveBranchId(
        '',
        branchMap,
        undefined,
        validBranchNames,
        'fa',
      );
      expect(result).toEqual({ branchId: undefined });
    });
  });
});
