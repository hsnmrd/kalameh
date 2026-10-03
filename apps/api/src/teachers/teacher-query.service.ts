import { Injectable } from '@nestjs/common';
import {
  ROLES,
  type JwtPayload,
  type SupportedLocale,
  type TeacherLookupResponse,
} from '@workspace/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherQueryService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(
    currentUser: JwtPayload,
    query: {
      search?: string;
      isActive?: boolean;
      instituteId?: string;
    },
    _locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === ROLES.SUPER_ADMIN && query.instituteId
        ? query.instituteId
        : currentUser.instituteId;

    const where: Record<string, unknown> = {
      role: ROLES.TEACHER,
      ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s } },
        { nationalCode: { contains: s } },
      ];
    }

    const teachers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: {
          include: {
            availabilities: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            teachableCourses: {
              include: { course: { select: { id: true, title: true } } },
              orderBy: { course: { title: 'asc' } },
            },
          },
        },
        _count: {
          select: {
            teachingClasses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teachers.map((t) => {
      const { _count, ...rest } = t;
      return {
        ...rest,
        classesCount: _count.teachingClasses,
      };
    });
  }

  async findOne(
    currentUser: JwtPayload,
    id: string,
    _locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        teacherProfile: {
          include: {
            availabilities: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
            teachableCourses: {
              include: { course: { select: { id: true, title: true } } },
              orderBy: { course: { title: 'asc' } },
            },
          },
        },
        teachingClasses: {
          select: {
            id: true,
            title: true,
            schedule: true,
            term: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            teachingClasses: true,
          },
        },
      },
    });

    const { _count, ...rest } = teacher;
    return {
      ...rest,
      classesCount: _count.teachingClasses,
    };
  }

  async lookup(
    currentUser: JwtPayload,
    nationalCode?: string,
    phone?: string,
  ): Promise<TeacherLookupResponse> {
    if (!nationalCode && !phone) {
      return { found: false, teacher: null };
    }

    const where: Record<string, unknown> = {
      role: ROLES.TEACHER,
      ...(currentUser.role === ROLES.SUPER_ADMIN
        ? {}
        : { instituteId: currentUser.instituteId }),
    };

    if (nationalCode) {
      where.nationalCode = nationalCode;
    } else if (phone) {
      where.phone = phone;
    }

    const teacher = await this.prisma.user.findFirst({
      where,
      include: {
        teacherProfile: true,
      },
    });

    if (!teacher) {
      return { found: false, teacher: null };
    }

    return {
      found: true,
      teacher: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        phone: teacher.phone,
        nationalCode: teacher.nationalCode,
        avatarUrl: teacher.avatarUrl,
        bio: teacher.teacherProfile?.bio ?? null,
        degree: teacher.teacherProfile?.degree ?? null,
      },
    };
  }
}
