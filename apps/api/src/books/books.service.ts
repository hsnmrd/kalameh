import {
  Injectable,
  ConflictException,
  BadRequestException,
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

    const books = await this.prisma.book.findMany({
      where: {
        instituteId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { publisher: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { courses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return books.map(({ _count, ...b }) => ({
      ...b,
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
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        courses: {
          include: {
            prerequisite: { select: { id: true, title: true } },
            _count: { select: { classes: true } },
          },
          orderBy: { title: 'asc' },
        },
        _count: { select: { courses: true } },
      },
    });

    const { _count, courses, ...data } = book;
    return {
      ...data,
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
        instituteId,
        title: dto.title,
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
        title: dto.title,
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

    if (dto.title && dto.title !== existing.title) {
      const duplicate = await this.prisma.book.findFirst({
        where: {
          instituteId: existing.instituteId,
          title: dto.title,
          id: { not: id },
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
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.author !== undefined ? { author: dto.author } : {}),
        ...(dto.publisher !== undefined ? { publisher: dto.publisher } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.coverUrl !== undefined ? { coverUrl: dto.coverUrl } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        _count: { select: { courses: true } },
      },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
      userId: currentUser.sub,
      module: 'BOOK',
      entityId: id,
      action: 'UPDATE',
      metadata: dto,
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      coursesCount: _count.courses,
    };
  }

  async remove(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<{ message: string }> {
    const existing = await this.findOne(id, currentUser, locale);

    if ((existing.coursesCount ?? 0) > 0) {
      throw new BadRequestException(
        this.i18n.t('books.cannotDeleteWithCourses', locale),
      );
    }

    await this.prisma.book.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId: existing.instituteId,
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
