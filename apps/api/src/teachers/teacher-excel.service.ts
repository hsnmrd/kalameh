import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';
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

const TeacherImportRowSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' }),
  lastName: z
    .string()
    .trim()
    .min(2, { message: 'نام خانوادگی باید حداقل ۲ کاراکتر باشد' }),
  phone: z
    .string()
    .trim()
    .regex(/^09\d{9}$/, {
      message: 'شماره تماس باید ۱۱ رقم و با ۰۹ شروع شود',
    }),
  nationalCode: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  password: z.string().trim().optional(),
});

@Injectable()
export class TeacherExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
  ) {}

  generateTemplate(locale: SupportedLocale = 'fa'): Buffer {
    return this.excelService.generateTeacherTemplate(locale);
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
        this.i18n.t('teachers.instituteRequired', locale),
      );
    }

    const where: Record<string, unknown> = {
      instituteId: targetInstituteId,
      role: ROLES.TEACHER,
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

    const teachers = await this.prisma.user.findMany({
      where,
      select: {
        firstName: true,
        lastName: true,
        phone: true,
        nationalCode: true,
        isActive: true,
        createdAt: true,
        teacherProfile: {
          select: {
            degree: true,
          },
        },
        teachingClasses: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = teachers.map((t) => ({
      firstName: t.firstName,
      lastName: t.lastName,
      phone: t.phone,
      nationalCode: t.nationalCode,
      degree: t.teacherProfile?.degree ?? null,
      classesCount: t.teachingClasses.length,
      isActive: t.isActive,
      createdAt: t.createdAt,
    }));

    return this.excelService.exportTeachers(mapped, locale);
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

    const rawRows = this.excelService.parseTeacherRows(fileBuffer, locale);
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

    // Preload existing phones in institute
    const existingUsers = await this.prisma.user.findMany({
      where: { instituteId: targetInstituteId },
      select: { phone: true },
    });
    const existingPhones = new Set(existingUsers.map((u) => u.phone));
    const seenPhonesInBatch = new Set<string>();

    const validRowsToInsert: Array<{
      instituteId: string;
      firstName: string;
      lastName: string;
      phone: string;
      nationalCode?: string;
      degree?: string;
      bio?: string;
      password: string;
    }> = [];

    const errors: ExcelImportError[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2;
      const raw = rawRows[i];

      const parseResult = TeacherImportRowSchema.safeParse(raw);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors
          .map((e) => e.message)
          .join('، ');
        errors.push({
          row: rowNumber,
          phone: raw.phone || undefined,
          message: errorMsg,
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
              ? 'استادی با این شماره تماس در این آموزشگاه قبلاً ثبت شده است'
              : 'A teacher with this phone number already exists in this institute',
        });
        continue;
      }

      seenPhonesInBatch.add(row.phone);

      const rawPassword = row.password || row.phone;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      validRowsToInsert.push({
        instituteId: targetInstituteId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        nationalCode: row.nationalCode || undefined,
        degree: row.degree || undefined,
        bio: row.bio || undefined,
        password: hashedPassword,
      });
    }

    if (validRowsToInsert.length > 0) {
      await this.prisma.$transaction(
        validRowsToInsert.map((item) =>
          this.prisma.user.create({
            data: {
              instituteId: item.instituteId,
              firstName: item.firstName,
              lastName: item.lastName,
              phone: item.phone,
              nationalCode: item.nationalCode,
              password: item.password,
              role: ROLES.TEACHER,
              isActive: true,
              teacherProfile: {
                create: {
                  degree: item.degree,
                  bio: item.bio,
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
