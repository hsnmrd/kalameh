import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { GenerateCoursesFromBookDto } from './dto/generate-courses.dto';
import { BatchGenerateCoursesDto } from './dto/generate-courses-batch.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  JwtPayload,
  SupportedLocale,
  CourseDto,
  CourseNamingFormat,
} from '@workspace/types';

@Injectable()
export class BookCoursesService {
  private readonly logger = new Logger(BookCoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private formatTitle(
    bookTitle: string,
    index: number,
    namingFormat: CourseNamingFormat = 'INDEX',
    partLabel: string,
    termLabel: string,
    totalCount: number,
  ): string {
    if (namingFormat === 'INDEX') {
      return `${bookTitle} - ${index}`;
    }
    if (namingFormat === 'TERM') {
      return totalCount === 1
        ? bookTitle
        : `${bookTitle} - ${termLabel} ${index}`;
    }
    // PART
    return totalCount === 1
      ? bookTitle
      : `${bookTitle} - ${partLabel} ${index}`;
  }

  async generateCourses(
    id: string,
    dto: GenerateCoursesFromBookDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<CourseDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    const book = await this.prisma.book.findFirstOrThrow({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN'
          ? {}
          : {
              OR: [
                { instituteId: null },
                ...(instituteId ? [{ instituteId }] : []),
              ],
            }),
      },
    });

    if (dto.startingPrerequisiteId) {
      await this.prisma.course.findFirstOrThrow({
        where: {
          id: dto.startingPrerequisiteId,
          instituteId,
        },
      });
    }

    const count = dto.termsCount;
    const partLabel = this.i18n.t('books.partLabel', locale);
    const termLabel = this.i18n.t('books.termLabel', locale);

    const generatedTitles: string[] = [];
    for (let i = 1; i <= count; i++) {
      generatedTitles.push(
        this.formatTitle(
          book.title,
          i,
          dto.namingFormat || 'INDEX',
          partLabel,
          termLabel,
          count,
        ),
      );
    }

    const conflicting = await this.prisma.course.findFirst({
      where: {
        instituteId,
        title: { in: generatedTitles },
      },
    });

    if (conflicting) {
      throw new ConflictException(
        `${this.i18n.t('courses.courseAlreadyExists', locale)}: "${conflicting.title}"`,
      );
    }

    const createdCourses: CourseDto[] = [];

    await this.prisma.$transaction(async (tx) => {
      let currentPrereqId: string | null = dto.startingPrerequisiteId || null;

      for (let i = 0; i < count; i++) {
        const title = generatedTitles[i];
        const course = await tx.course.create({
          data: {
            instituteId,
            title,
            baseFee: dto.baseFee,
            prerequisiteId: currentPrereqId,
            bookId: book.id,
          },
          include: {
            prerequisite: {
              select: { id: true, title: true },
            },
            book: {
              select: { id: true, title: true },
            },
            _count: { select: { classes: true } },
          },
        });

        currentPrereqId = course.id;
        const { _count, ...courseData } = course;
        createdCourses.push({
          ...courseData,
          classesCount: _count.classes,
        });
      }
    });

    this.logger.log(
      `Generated ${createdCourses.length} courses from book "${book.title}" (${book.id}) for institute ${instituteId}`,
    );

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'BOOK',
      entityId: book.id,
      action: 'GENERATE_COURSES',
      metadata: {
        bookTitle: book.title,
        coursesCount: createdCourses.length,
        courseIds: createdCourses.map((c) => c.id),
      },
    });

    return createdCourses;
  }

  async generateCoursesBatch(
    dto: BatchGenerateCoursesDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<CourseDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (!dto.items || dto.items.length === 0) {
      return [];
    }

    const bookIds = Array.from(new Set(dto.items.map((it) => it.bookId)));
    const books = await this.prisma.book.findMany({
      where: {
        id: { in: bookIds },
        ...(currentUser.role === 'SUPER_ADMIN'
          ? {}
          : {
              OR: [
                { instituteId: null },
                ...(instituteId ? [{ instituteId }] : []),
              ],
            }),
      },
    });

    const booksMap = new Map(books.map((b) => [b.id, b]));
    for (const id of bookIds) {
      if (!booksMap.has(id)) {
        throw new NotFoundException(`Book not found: ${id}`);
      }
    }

    // Check starting prerequisites if any
    const startingPrereqIds = dto.items
      .map((it) => it.startingPrerequisiteId)
      .filter((id): id is string => Boolean(id));

    if (startingPrereqIds.length > 0) {
      const existingPrereqs = await this.prisma.course.findMany({
        where: {
          id: { in: startingPrereqIds },
          instituteId,
        },
        select: { id: true },
      });
      const existingPrereqSet = new Set(existingPrereqs.map((p) => p.id));
      for (const id of startingPrereqIds) {
        if (!existingPrereqSet.has(id)) {
          throw new NotFoundException(`Prerequisite course not found: ${id}`);
        }
      }
    }

    const partLabel = this.i18n.t('books.partLabel', locale);
    const termLabel = this.i18n.t('books.termLabel', locale);

    // Generate planned titles and check for duplicates within the batch
    const allPlannedTitles: string[] = [];
    const titleSet = new Set<string>();

    for (const item of dto.items) {
      const book = booksMap.get(item.bookId)!;
      const count = item.termsCount;
      const namingFormat = item.namingFormat || 'INDEX';

      for (let i = 1; i <= count; i++) {
        const title = this.formatTitle(
          book.title,
          i,
          namingFormat,
          partLabel,
          termLabel,
          count,
        );
        if (titleSet.has(title)) {
          throw new ConflictException(
            `${this.i18n.t('courses.courseAlreadyExists', locale)}: "${title}"`,
          );
        }
        titleSet.add(title);
        allPlannedTitles.push(title);
      }
    }

    // Check existing courses in database for conflict
    const conflicting = await this.prisma.course.findFirst({
      where: {
        instituteId,
        title: { in: allPlannedTitles },
      },
      select: { title: true },
    });

    if (conflicting) {
      throw new ConflictException(
        `${this.i18n.t('courses.courseAlreadyExists', locale)}: "${conflicting.title}"`,
      );
    }

    const createdCourses: CourseDto[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const book = booksMap.get(item.bookId)!;
        const count = item.termsCount;
        const namingFormat = item.namingFormat || 'INDEX';
        let currentPrereqId: string | null =
          item.startingPrerequisiteId || null;

        for (let i = 1; i <= count; i++) {
          const title = this.formatTitle(
            book.title,
            i,
            namingFormat,
            partLabel,
            termLabel,
            count,
          );

          const course = await tx.course.create({
            data: {
              instituteId,
              title,
              baseFee: item.baseFee,
              prerequisiteId: currentPrereqId,
              bookId: book.id,
            },
            include: {
              prerequisite: {
                select: { id: true, title: true },
              },
              book: {
                select: { id: true, title: true },
              },
              _count: { select: { classes: true } },
            },
          });

          currentPrereqId = course.id;
          const { _count, ...courseData } = course;
          createdCourses.push({
            ...courseData,
            classesCount: _count.classes,
          });
        }
      }
    });

    this.logger.log(
      `Batch generated ${createdCourses.length} courses across ${dto.items.length} books for institute ${instituteId}`,
    );

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'BOOK',
      entityId: books[0]?.id ?? 'BATCH',
      action: 'GENERATE_COURSES_BATCH',
      metadata: {
        booksCount: dto.items.length,
        coursesCount: createdCourses.length,
        courseIds: createdCourses.map((c) => c.id),
      },
    });

    return createdCourses;
  }
}
