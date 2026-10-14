import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { GenerateCoursesFromBookDto } from './dto/generate-courses.dto';
import { BookCoursesService } from './book-courses.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import type {
  JwtPayload,
  SupportedLocale,
  BookDto,
  CourseDto,
} from '@workspace/types';

@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly auditLogsService: AuditLogsService,
    private readonly bookCoursesService: BookCoursesService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
    search?: string,
  ): Promise<BookDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && targetInstituteId
        ? targetInstituteId
        : currentUser.instituteId;

    const whereConditions: Record<string, unknown> = {
      ...(currentUser.role === 'SUPER_ADMIN' && !targetInstituteId
        ? {}
        : {
            OR: [
              { instituteId: null },
              ...(instituteId ? [{ instituteId }] : []),
            ],
          }),
    };

    if (search?.trim()) {
      const q = search.trim();
      whereConditions.AND = [
        {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { author: { contains: q, mode: 'insensitive' } },
            { publisher: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const books = await this.prisma.book.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: {
            courses: {
              where:
                currentUser.role === 'SUPER_ADMIN' && !instituteId
                  ? {}
                  : { instituteId },
            },
          },
        },
      },
      orderBy: [{ title: 'asc' }],
    });

    return books.map(({ _count, ...b }) => ({
      ...b,
      isGlobal: !b.instituteId,
      coursesCount: _count.courses,
    }));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<BookDto & { courses: CourseDto[] }> {
    void locale;
    const instituteId = currentUser.instituteId;

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
      include: {
        courses: {
          where:
            currentUser.role === 'SUPER_ADMIN' && !instituteId
              ? {}
              : { instituteId },
          include: {
            prerequisite: { select: { id: true, title: true } },
            _count: { select: { classes: true } },
          },
          orderBy: { title: 'asc' },
        },
        _count: {
          select: {
            courses: {
              where:
                currentUser.role === 'SUPER_ADMIN' && !instituteId
                  ? {}
                  : { instituteId },
            },
          },
        },
      },
    });

    const { _count, courses, ...data } = book;
    return {
      ...data,
      isGlobal: !book.instituteId,
      coursesCount: _count.courses,
      courses: courses.map(({ _count: cCount, ...c }) => ({
        ...c,
        classesCount: cCount.classes,
      })),
    };
  }

  async create(
    dto: CreateBookDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<BookDto> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    const existing = await this.prisma.book.findFirst({
      where: {
        title: dto.title.trim(),
        OR: [{ instituteId: null }, ...(instituteId ? [{ instituteId }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('books.bookAlreadyExists', locale),
      );
    }

    const created = await this.prisma.book.create({
      data: {
        instituteId,
        title: dto.title.trim(),
        author: dto.author || null,
        publisher: dto.publisher || null,
        description: dto.description || null,
        coverUrl: dto.coverUrl || null,
      },
      include: {
        _count: { select: { courses: true } },
      },
    });

    this.logger.log(
      `Book created: "${created.title}" (${created.id}) for institute ${instituteId}`,
    );

    await this.auditLogsService.log({
      instituteId,
      userId: currentUser.sub,
      module: 'BOOK',
      entityId: created.id,
      action: 'CREATE',
      metadata: {
        title: created.title,
        author: created.author,
        publisher: created.publisher,
      },
    });

    const { _count, ...data } = created;
    return {
      ...data,
      coursesCount: _count.courses,
    };
  }

  async update(
    id: string,
    dto: UpdateBookDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<BookDto> {
    const existing = await this.findOne(id, currentUser, locale);

    if (!existing.instituteId && currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('books.cannotModifyGlobalBook', locale),
      );
    }

    if (dto.title && dto.title !== existing.title) {
      const duplicate = await this.prisma.book.findFirst({
        where: {
          title: dto.title.trim(),
          id: { not: id },
          OR: [
            { instituteId: null },
            ...(existing.instituteId
              ? [{ instituteId: existing.instituteId }]
              : []),
          ],
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('books.bookAlreadyExists', locale),
        );
      }
    }

    const updated = await this.prisma.book.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.author !== undefined ? { author: dto.author } : {}),
        ...(dto.publisher !== undefined ? { publisher: dto.publisher } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        _count: {
          select: {
            courses: {
              where:
                currentUser.role === 'SUPER_ADMIN' && !existing.instituteId
                  ? {}
                  : {
                      instituteId:
                        existing.instituteId ?? currentUser.instituteId,
                    },
            },
          },
        },
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId ?? currentUser.instituteId,
      userId: currentUser.sub,
      module: 'BOOK',
      entityId: id,
      action: 'UPDATE',
      metadata: dto,
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      isGlobal: !updated.instituteId,
      coursesCount: _count.courses,
    };
  }

  async remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ message: string }> {
    const existing = await this.findOne(id, currentUser, locale);

    if (!existing.instituteId && currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('books.cannotDeleteGlobalBook', locale),
      );
    }

    if ((existing.coursesCount ?? 0) > 0) {
      throw new BadRequestException(
        this.i18n.t('books.cannotDeleteWithCourses', locale),
      );
    }

    await this.prisma.book.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId ?? currentUser.instituteId,
      userId: currentUser.sub,
      module: 'BOOK',
      entityId: id,
      action: 'DELETE',
      metadata: { title: existing.title },
    });

    return { message: 'Book deleted successfully' };
  }

  async generateCourses(
    id: string,
    dto: GenerateCoursesFromBookDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<CourseDto[]> {
    return this.bookCoursesService.generateCourses(
      id,
      dto,
      currentUser,
      locale,
    );
  }
}
