import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
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
import { CourseImportRowSchema } from '../common/excel/course-workbook';

function normalizeCourseTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\u200c/g, '') // remove zero-width non-joiner
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\s+/g, ' ');
}

@Injectable()
export class CourseExcelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
  ) {}

  generateTemplate(locale: SupportedLocale = 'fa'): Buffer {
    return this.excelService.generateCourseTemplate(locale);
  }

  async exportToExcel(
    currentUser: JwtPayload,
    query: {
      search?: string;
      prerequisiteId?: string;
      instituteId?: string;
    },
    locale: SupportedLocale = 'fa',
  ): Promise<Buffer> {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && query.instituteId
        ? query.instituteId
        : currentUser.instituteId;

    if (!targetInstituteId) {
      throw new BadRequestException(
        locale === 'fa'
          ? 'شناسه آموزشگاه الزامی است'
          : 'Institute ID is required',
      );
    }

    const where: Record<string, unknown> = {
      instituteId: targetInstituteId,
    };

    if (query.prerequisiteId) {
      where.prerequisiteId =
        query.prerequisiteId === 'NONE' ? null : query.prerequisiteId;
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.title = { contains: term, mode: 'insensitive' };
    }

    const courses = await this.prisma.course.findMany({
      where,
      select: {
        title: true,
        baseFee: true,
        createdAt: true,
        prerequisite: {
          select: {
            title: true,
          },
        },
        _count: {
          select: {
            classes: true,
            qualifiedTeachers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = courses.map((c) => ({
      title: c.title,
      baseFee: c.baseFee,
      prerequisiteTitle: c.prerequisite?.title ?? null,
      classesCount: c._count.classes,
      qualifiedTeachersCount: c._count.qualifiedTeachers,
      createdAt: c.createdAt,
    }));

    return this.excelService.exportCourses(mapped, locale);
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

    const rawRows = this.excelService.parseCourseRows(fileBuffer, locale);
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

    const existingCourses = await this.prisma.course.findMany({
      where: { instituteId: targetInstituteId },
      select: { id: true, title: true },
    });

    // Map normalized course titles to course ID
    const titleToIdMap = new Map<string, string>();
    for (const ec of existingCourses) {
      titleToIdMap.set(normalizeCourseTitle(ec.title), ec.id);
    }

    const seenTitlesInBatch = new Set<string>();
    const validRowsToInsert: Array<{
      title: string;
      baseFee: number;
      prerequisiteTitle?: string;
    }> = [];

    const errors: ExcelImportError[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2;
      const raw = rawRows[i];

      const parseResult = CourseImportRowSchema.safeParse(raw);
      if (!parseResult.success) {
        errors.push({
          row: rowNumber,
          message: parseResult.error.errors.map((e) => e.message).join('، '),
        });
        continue;
      }

      const row = parseResult.data;
      const normalizedTitle = normalizeCourseTitle(row.title);

      if (seenTitlesInBatch.has(normalizedTitle)) {
        errors.push({
          row: rowNumber,
          message:
            locale === 'fa'
              ? `دوره با عنوان "${row.title}" در این فایل تکراری است`
              : `Course with title "${row.title}" is duplicated in this file`,
        });
        continue;
      }

      if (titleToIdMap.has(normalizedTitle)) {
        errors.push({
          row: rowNumber,
          message:
            locale === 'fa'
              ? `دوره‌ای با عنوان "${row.title}" قبلاً در این آموزشگاه ثبت شده است`
              : `A course with title "${row.title}" already exists in this institute`,
        });
        continue;
      }

      seenTitlesInBatch.add(normalizedTitle);

      validRowsToInsert.push({
        title: row.title,
        baseFee: row.baseFee,
        prerequisiteTitle: row.prerequisiteTitle,
      });
    }

    if (validRowsToInsert.length > 0) {
      // Pass 1: Create all valid courses in a transaction
      const createdCourses: Array<{ id: string; title: string }> =
        await this.prisma.$transaction(
          validRowsToInsert.map((item) =>
            this.prisma.course.create({
              data: {
                instituteId: targetInstituteId,
                title: item.title,
                baseFee: item.baseFee,
              },
              select: { id: true, title: true },
            }),
          ),
        );

      // Register newly created courses in the title map
      for (const created of createdCourses) {
        titleToIdMap.set(normalizeCourseTitle(created.title), created.id);
      }

      // Pass 2: Connect prerequisite relations
      const prerequisiteUpdates: Array<Promise<unknown>> = [];
      for (let idx = 0; idx < validRowsToInsert.length; idx++) {
        const item = validRowsToInsert[idx];
        const createdCourse = createdCourses[idx];

        if (item.prerequisiteTitle?.trim()) {
          const normalizedPrereqTitle = normalizeCourseTitle(
            item.prerequisiteTitle,
          );
          const prerequisiteId = titleToIdMap.get(normalizedPrereqTitle);

          if (prerequisiteId && prerequisiteId !== createdCourse.id) {
            prerequisiteUpdates.push(
              this.prisma.course.update({
                where: { id: createdCourse.id },
                data: { prerequisiteId },
              }),
            );
          }
        }
      }

      if (prerequisiteUpdates.length > 0) {
        await Promise.all(prerequisiteUpdates);
      }
    }

    return {
      totalRows: rawRows.length,
      importedCount: validRowsToInsert.length,
      failedCount: errors.length,
      errors,
    };
  }
}
