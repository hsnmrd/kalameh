import { Injectable } from '@nestjs/common';
import {
  type ClassDto,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { ClassFilterDto } from './dto/class-filter.dto';
@Injectable()
export class ClassQueryService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(
    currentUser: JwtPayload,
    filter?: ClassFilterDto,
  ): Promise<ClassDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && filter?.instituteId
        ? filter.instituteId
        : currentUser.instituteId;

    const classes = await this.prisma.class.findMany({
      where: {
        instituteId,
        ...(filter?.termId ? { termId: filter.termId } : {}),
        ...(filter?.courseId ? { courseId: filter.courseId } : {}),
        ...(filter?.branchId ? { branchId: filter.branchId } : {}),
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
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
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
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
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
    const instituteId = currentUser.instituteId;
    const user = await this.prisma.user.findFirst({
      where: {
        id: currentUser.sub,
        instituteId,
      },
      include: {
        currentAllowedCourse: true,
      },
    });

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

    const course = await this.prisma.course.findFirst({
      where: {
        id: targetCourseId,
        instituteId,
      },
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
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
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
    _locale: SupportedLocale = 'fa',
  ): Promise<ClassDto> {
    const instituteId = currentUser.instituteId;

    const cls = await this.prisma.class.findFirstOrThrow({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
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
        classroom: {
          select: {
            id: true,
            name: true,
            capacity: true,
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

    const { _count, ...data } = cls;
    return {
      ...data,
      enrolledCount: _count.enrollments,
    };
  }
}
