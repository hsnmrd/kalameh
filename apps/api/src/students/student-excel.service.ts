import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import {
  ROLES,
  type JwtPayload,
  type SupportedLocale,
  type ExcelImportResult,
  type ExcelImportError,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import {
  StudentImportRowSchema,
  ValidStudentImportRow,
  parseShift,
  parseDayPref,
} from '../common/excel/student-workbook';

@Injectable()
export class StudentExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
  ) {}

  generateTemplate(locale: SupportedLocale = 'fa'): Buffer {
    return this.excelService.generateStudentTemplate(locale);
  }

  async exportToExcel(
    currentUser: JwtPayload,
    query: { search?: string; isActive?: boolean; instituteId?: string },
    locale: SupportedLocale = 'fa',
  ): Promise<Buffer> {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && query.instituteId
        ? query.instituteId
        : currentUser.instituteId;

    if (!targetInstituteId) {
      throw new BadRequestException(
        this.i18n.t('students.instituteRequired', locale),
      );
    }

    const where: Record<string, unknown> = {
      instituteId: targetInstituteId,
      role: ROLES.STUDENT,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
        { nationalCode: { contains: term } },
      ];
    }

    const students = await this.prisma.user.findMany({
      where,
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        nationalCode: true,
        isActive: true,
        createdAt: true,
        branch: { select: { name: true } },
        currentAllowedCourse: { select: { title: true } },
        studentProfile: {
          select: {
            fatherName: true,
            gender: true,
            birthDate: true,
            emergencyPhone: true,
            address: true,
            schoolShift: true,
            dayPreference: true,
            scheduleStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = students.map((s) => ({
      firstName: s.firstName,
      lastName: s.lastName,
      phone: s.phone,
      nationalCode: s.nationalCode,
      currentAllowedCourseTitle: s.currentAllowedCourse?.title ?? null,
      fatherName: s.studentProfile?.fatherName ?? null,
      gender: s.studentProfile?.gender ?? null,
      birthDate: s.studentProfile?.birthDate ?? null,
      emergencyPhone: s.studentProfile?.emergencyPhone ?? null,
      address: s.studentProfile?.address ?? null,
      schoolShift: s.studentProfile?.schoolShift ?? null,
      dayPreference: s.studentProfile?.dayPreference ?? null,
      branchName: s.branch?.name ?? null,
      scheduleStatus: s.studentProfile?.scheduleStatus ?? null,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));

    return this.excelService.exportStudents(mapped, locale);
  }

  async importFromExcel(
    currentUser: JwtPayload,
    fileBuffer: Buffer,
    locale: SupportedLocale = 'fa',
    instituteId?: string,
  ): Promise<ExcelImportResult> {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && instituteId
        ? instituteId
        : currentUser.instituteId;

    if (!targetInstituteId) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const rawRows = this.excelService.parseStudentRows(fileBuffer, locale);
    if (rawRows.length === 0) {
      return {
        totalRows: 0,
        importedCount: 0,
        failedCount: 0,
        errors: [
          {
            row: 1,
            message:
              locale === 'fa'
                ? 'فایل اکسل ارسالی خالی است یا ساختار نامعتبر دارد'
                : 'The uploaded Excel file is empty or has an invalid structure',
          },
        ],
      };
    }

    const [existingUsers, instituteCourses, instituteBranches] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { instituteId: targetInstituteId },
          select: { phone: true },
        }),
        this.prisma.course.findMany({
          where: { instituteId: targetInstituteId },
          select: { id: true, title: true },
        }),
        this.prisma.branch.findMany({
          where: { instituteId: targetInstituteId },
          select: { id: true, name: true },
        }),
      ]);

    const existingPhones = new Set(existingUsers.map((u) => u.phone));
    const courseMap = new Map(
      instituteCourses.map((c) => [c.title.trim().toLowerCase(), c.id]),
    );
    const branchMap = new Map(
      instituteBranches.map((b) => [b.name.trim().toLowerCase(), b.id]),
    );

    const seenPhonesInBatch = new Set<string>();
    const validRowsToInsert: ValidStudentImportRow[] = [];

    const errors: ExcelImportError[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2;
      const raw = rawRows[i];

      const parseResult = StudentImportRowSchema.safeParse(raw);
      if (!parseResult.success) {
        errors.push({
          row: rowNumber,
          phone: raw.phone || undefined,
          message: parseResult.error.errors.map((e) => e.message).join('، '),
        });
        continue;
      }

      const row = parseResult.data;

      if (seenPhonesInBatch.has(row.phone)) {
        errors.push({
          row: rowNumber,
          phone: row.phone,
          message:
            locale === 'fa'
              ? `شماره موبایل ${row.phone} در این فایل تکراری است`
              : `Phone number ${row.phone} is duplicated in this file`,
        });
        continue;
      }

      if (existingPhones.has(row.phone)) {
        errors.push({
          row: rowNumber,
          phone: row.phone,
          message:
            locale === 'fa'
              ? 'فراگیری با این شماره تماس در این آموزشگاه قبلاً ثبت شده است'
              : 'A student with this phone number already exists in this institute',
        });
        continue;
      }

      seenPhonesInBatch.add(row.phone);

      const courseId = row.currentAllowedCourseTitle
        ? courseMap.get(row.currentAllowedCourseTitle.toLowerCase())
        : undefined;

      const branchId = row.branchName
        ? branchMap.get(row.branchName.toLowerCase())
        : undefined;

      let parsedBirthDate: Date | undefined;
      if (row.birthDate) {
        const d = new Date(row.birthDate);
        if (!isNaN(d.getTime())) parsedBirthDate = d;
      }

      const rawPassword = row.password || row.phone;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      validRowsToInsert.push({
        instituteId: targetInstituteId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        nationalCode: row.nationalCode || undefined,
        currentAllowedCourseId: courseId,
        branchId,
        fatherName: row.fatherName || undefined,
        gender: row.gender || undefined,
        birthDate: parsedBirthDate,
        emergencyPhone: row.emergencyPhone || undefined,
        address: row.address || undefined,
        schoolShift: parseShift(row.schoolShift),
        dayPreference: parseDayPref(row.dayPreference),
        password: hashedPassword,
      });
    }

    if (validRowsToInsert.length > 0) {
      await this.prisma.$transaction(
        validRowsToInsert.map((item) =>
          this.prisma.user.create({
            data: {
              instituteId: item.instituteId,
              branchId: item.branchId,
              currentAllowedCourseId: item.currentAllowedCourseId,
              firstName: item.firstName,
              lastName: item.lastName,
              phone: item.phone,
              nationalCode: item.nationalCode,
              password: item.password,
              role: ROLES.STUDENT,
              isActive: true,
              studentProfile: {
                create: {
                  fatherName: item.fatherName,
                  gender: item.gender,
                  birthDate: item.birthDate,
                  emergencyPhone: item.emergencyPhone,
                  address: item.address,
                  schoolShift: item.schoolShift,
                  dayPreference: item.dayPreference,
                },
              },
            },
          }),
        ),
      );
    }

    return {
      totalRows: rawRows.length,
      importedCount: validRowsToInsert.length,
      failedCount: errors.length,
      errors,
    };
  }
}
