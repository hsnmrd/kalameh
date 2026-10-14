import { Injectable } from '@nestjs/common';
import {
  ENROLLMENT_STATUSES,
  type ClassDto,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { ClassFilterDto } from './dto/class-filter.dto';
@Injectable()
export class ClassQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}
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
            startDate: true,
            endDate: true,
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
                  in: [
                    ENROLLMENT_STATUSES.PENDING_PAYMENT,
                    ENROLLMENT_STATUSES.PENDING_APPROVAL,
                    ENROLLMENT_STATUSES.ENROLLED,
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      classes.map(async ({ _count, ...cls }) => {
        const lockCount = await this.redis.countClassLocks(cls.id);
        return {
          ...cls,
          enrolledCount: _count.enrollments + lockCount,
        };
      }),
    );
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
            startDate: true,
            endDate: true,
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
                  in: [
                    ENROLLMENT_STATUSES.PENDING_PAYMENT,
                    ENROLLMENT_STATUSES.PENDING_APPROVAL,
                    ENROLLMENT_STATUSES.ENROLLED,
                  ],
                },
              },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    const classesWithLocks = await Promise.all(
      classes.map(async ({ _count, ...cls }) => {
        const lockCount = await this.redis.countClassLocks(cls.id);
        return {
          ...cls,
          enrolledCount: _count.enrollments + lockCount,
        };
      }),
    );

    return {
      allowedCourseTitle: course?.title,
      classes: classesWithLocks,
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
            startDate: true,
            endDate: true,
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
                  in: [
                    ENROLLMENT_STATUSES.PENDING_PAYMENT,
                    ENROLLMENT_STATUSES.PENDING_APPROVAL,
                    ENROLLMENT_STATUSES.ENROLLED,
                  ],
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
