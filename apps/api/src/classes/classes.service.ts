import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassFilterDto } from './dto/class-filter.dto';
import type { JwtPayload, SupportedLocale, ClassDto } from '@workspace/types';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    filter?: ClassFilterDto,
  ): Promise<ClassDto[]> {
    const instituteId = currentUser.instituteId;

    const classes = await this.prisma.class.findMany({
      where: {
        instituteId,
        ...(filter?.termId ? { termId: filter.termId } : {}),
        ...(filter?.courseId ? { courseId: filter.courseId } : {}),
        ...(filter?.search
          ? {
              OR: [
                { title: { contains: filter.search, mode: 'insensitive' } },
                {
                  teacherName: { contains: filter.search, mode: 'insensitive' },
                },
              ],
            }
          : {}),
      },
      include: {
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classes.map(({ _count, ...cls }) => ({
      ...cls,
      enrolledCount: _count.enrollments,
    }));
  }

  async findAvailableForStudent(
    currentUser: JwtPayload,
  ): Promise<{ allowedCourseTitle?: string; classes: ClassDto[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.sub },
      include: {
        currentAllowedCourse: true,
      },
    });

    const instituteId = currentUser.instituteId;
    let targetCourseId = user?.currentAllowedCourseId;

    // If user has no specific allowed course set, default to root courses (prerequisiteId: null)
    if (!targetCourseId) {
      const rootCourse = await this.prisma.course.findFirst({
        where: {
          instituteId,
          prerequisiteId: null,
        },
        orderBy: { createdAt: 'asc' },
      });
      targetCourseId = rootCourse?.id;
    }

    if (!targetCourseId) {
      return { allowedCourseTitle: undefined, classes: [] };
    }

    const course = await this.prisma.course.findUnique({
      where: { id: targetCourseId },
    });

    const classes = await this.prisma.class.findMany({
      where: {
        instituteId,
        courseId: targetCourseId,
        term: {
          isActive: true,
        },
      },
      include: {
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    return {
      allowedCourseTitle: course?.title,
      classes: classes.map(({ _count, ...cls }) => ({
        ...cls,
        enrolledCount: _count.enrollments,
      })),
    };
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const instituteId = currentUser.instituteId;

    const cls = await this.prisma.class.findFirst({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException(this.i18n.t('classes.classNotFound', locale));
    }

    const { _count, ...data } = cls;
    return {
      ...data,
      enrolledCount: _count.enrollments,
    };
  }

  async create(
    dto: CreateClassDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const instituteId = currentUser.instituteId;

    // Verify Term exists and belongs to institute
    const term = await this.prisma.term.findFirst({
      where: {
        id: dto.termId,
        instituteId,
      },
    });

    if (!term) {
      throw new BadRequestException(
        this.i18n.t('classes.invalidTermOrCourse', locale),
      );
    }

    // Verify Course exists and belongs to institute
    const course = await this.prisma.course.findFirst({
      where: {
        id: dto.courseId,
        instituteId,
      },
    });

    if (!course) {
      throw new BadRequestException(
        this.i18n.t('classes.invalidTermOrCourse', locale),
      );
    }

    const created = await this.prisma.class.create({
      data: {
        instituteId,
        termId: dto.termId,
        courseId: dto.courseId,
        title: dto.title,
        capacity: dto.capacity,
        fee: dto.fee,
        teacherName: dto.teacherName || null,
        schedule: dto.schedule || null,
      },
      include: {
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return {
      id: created.id,
      instituteId: created.instituteId,
      termId: created.termId,
      courseId: created.courseId,
      title: created.title,
      capacity: created.capacity,
      fee: created.fee,
      teacherName: created.teacherName,
      schedule: created.schedule,
      term: created.term,
      course: created.course,
      enrolledCount: 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(
    id: string,
    dto: UpdateClassDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const existing = await this.findOne(id, currentUser, locale);

    if (dto.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: dto.termId, instituteId: existing.instituteId },
      });
      if (!term) {
        throw new BadRequestException(
          this.i18n.t('classes.invalidTermOrCourse', locale),
        );
      }
    }

    if (dto.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: dto.courseId, instituteId: existing.instituteId },
      });
      if (!course) {
        throw new BadRequestException(
          this.i18n.t('classes.invalidTermOrCourse', locale),
        );
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.termId ? { termId: dto.termId } : {}),
        ...(dto.courseId ? { courseId: dto.courseId } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.fee !== undefined ? { fee: dto.fee } : {}),
        ...(dto.teacherName !== undefined
          ? { teacherName: dto.teacherName }
          : {}),
        ...(dto.schedule !== undefined ? { schedule: dto.schedule } : {}),
      },
      include: {
        term: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        _count: {
          select: {
            enrollments: {
              where: {
                status: {
                  in: ['PENDING_PAYMENT', 'PENDING_APPROVAL', 'ENROLLED'],
                },
              },
            },
          },
        },
      },
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      enrolledCount: _count.enrollments,
    };
  }
}
