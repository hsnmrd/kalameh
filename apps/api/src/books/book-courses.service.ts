import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { GenerateCoursesFromBookDto } from './dto/generate-courses.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type { JwtPayload, SupportedLocale, CourseDto } from '@workspace/types';

@Injectable()
export class BookCoursesService {
  private readonly logger = new Logger(BookCoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

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
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
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
    const label =
      dto.namingFormat === 'TERM'
        ? this.i18n.t('books.termLabel', locale)
        : this.i18n.t('books.partLabel', locale);

    const generatedTitles: string[] = [];
    for (let i = 1; i <= count; i++) {
      const partSuffix = count === 1 ? '' : ` - ${label} ${i}`;
      generatedTitles.push(`${book.title}${partSuffix}`);
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
}
