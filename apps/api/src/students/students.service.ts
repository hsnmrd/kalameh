import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentFilterDto } from './dto/student-filter.dto';
import type {
  JwtPayload,
  SupportedLocale,
  StudentLookupResponse,
  AddStudentNoteInput,
} from '@workspace/types';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    currentUser: JwtPayload,
    dto: CreateStudentDto,
    locale: SupportedLocale = 'fa',
    file?: Express.Multer.File,
  ) {
    const avatarUrl = file
      ? `/uploads/avatars/${file.filename}`
      : dto.avatarUrl;

    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    if (currentUser.role === 'STUDENT') {
      throw new ForbiddenException(
        this.i18n.t('students.unauthorizedStudentCreation', locale),
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: {
        phone_instituteId: {
          phone: dto.phone,
          instituteId: targetInstituteId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('students.studentAlreadyExists', locale),
      );
    }

    const rawPassword = dto.password || dto.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const parsedBirthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    const initialNote = dto.notes?.trim();

    const student = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          instituteId: targetInstituteId,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          password: hashedPassword,
          role: 'STUDENT',
          nationalCode: dto.nationalCode,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          currentAllowedCourseId: dto.currentAllowedCourseId,
        },
      });

      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          fatherName: dto.fatherName,
          birthDate: parsedBirthDate,
          gender: dto.gender,
          emergencyPhone: dto.emergencyPhone,
          address: dto.address,
        },
      });

      if (initialNote) {
        await tx.studentNote.create({
          data: {
            studentProfileId: profile.id,
            createdByUserId: currentUser.sub,
            content: initialNote,
          },
        });
      }

      const profileWithNotes = await tx.studentProfile.findUnique({
        where: { id: profile.id },
        include: {
          notes: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return {
        ...user,
        studentProfile: profileWithNotes,
      };
    });

    return {
      id: student.id,
      instituteId: student.instituteId,
      role: student.role,
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      nationalCode: student.nationalCode,
      avatarUrl: student.avatarUrl,
      isActive: student.isActive,
      currentAllowedCourseId: student.currentAllowedCourseId,
      studentProfile: student.studentProfile,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  async findAll(
    currentUser: JwtPayload,
    filter?: StudentFilterDto,
    locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' && filter?.instituteId
        ? filter.instituteId
        : currentUser.instituteId;

    if (currentUser.role === 'STUDENT') {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const search = filter?.search?.trim();

    const students = await this.prisma.user.findMany({
      where: {
        instituteId: targetInstituteId,
        role: 'STUDENT',
        ...(filter?.courseId
          ? { currentAllowedCourseId: filter.courseId }
          : {}),
        ...(typeof filter?.isActive === 'boolean'
          ? { isActive: filter.isActive }
          : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { nationalCode: { contains: search } },
                {
                  studentProfile: {
                    fatherName: { contains: search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        studentProfile: {
          include: {
            notes: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        currentAllowedCourse: {
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
      orderBy: { createdAt: 'desc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return students.map(({ _count, password, ...st }) => ({
      ...st,
      enrollmentsCount: _count.enrollments,
    }));
  }

  async findOne(
    currentUser: JwtPayload,
    id: string,
    locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.instituteId;

    const student = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'STUDENT',
        ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      },
      include: {
        studentProfile: {
          include: {
            notes: {
              include: {
                createdBy: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        currentAllowedCourse: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        enrollments: {
          include: {
            class: {
              include: {
                term: true,
                course: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(
        this.i18n.t('students.studentNotFound', locale),
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = student;
    return rest;
  }

  async update(
    currentUser: JwtPayload,
    id: string,
    dto: UpdateStudentDto,
    locale: SupportedLocale = 'fa',
    file?: Express.Multer.File,
  ) {
    const avatarUrl = file
      ? `/uploads/avatars/${file.filename}`
      : dto.avatarUrl;

    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.instituteId;

    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'STUDENT',
        ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      },
      include: { studentProfile: true },
    });

    if (!existing) {
      throw new NotFoundException(
        this.i18n.t('students.studentNotFound', locale),
      );
    }

    if (dto.phone && dto.phone !== existing.phone) {
      const phoneInUse = await this.prisma.user.findUnique({
        where: {
          phone_instituteId: {
            phone: dto.phone,
            instituteId: existing.instituteId,
          },
        },
      });

      if (phoneInUse) {
        throw new ConflictException(
          this.i18n.t('students.phoneAlreadyInUse', locale),
        );
      }
    }

    const parsedBirthDate =
      dto.birthDate !== undefined
        ? dto.birthDate
          ? new Date(dto.birthDate)
          : null
        : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          nationalCode: dto.nationalCode,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          isActive: dto.isActive,
          currentAllowedCourseId: dto.currentAllowedCourseId,
        },
      });

      const profile = await tx.studentProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          fatherName: dto.fatherName,
          birthDate: parsedBirthDate,
          gender: dto.gender,
          emergencyPhone: dto.emergencyPhone,
          address: dto.address,
        },
        update: {
          ...(dto.fatherName !== undefined
            ? { fatherName: dto.fatherName }
            : {}),
          ...(parsedBirthDate !== undefined
            ? { birthDate: parsedBirthDate }
            : {}),
          ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
          ...(dto.emergencyPhone !== undefined
            ? { emergencyPhone: dto.emergencyPhone }
            : {}),
          ...(dto.address !== undefined ? { address: dto.address } : {}),
        },
      });

      const newNote = dto.newNote?.trim();
      if (newNote) {
        await tx.studentNote.create({
          data: {
            studentProfileId: profile.id,
            createdByUserId: currentUser.sub,
            content: newNote,
          },
        });
      }

      const profileWithNotes = await tx.studentProfile.findUnique({
        where: { userId: id },
        include: {
          notes: {
            include: {
              createdBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      return {
        ...user,
        studentProfile: profileWithNotes,
      };
    });

    return {
      id: updated.id,
      instituteId: updated.instituteId,
      role: updated.role,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      nationalCode: updated.nationalCode,
      avatarUrl: updated.avatarUrl,
      isActive: updated.isActive,
      currentAllowedCourseId: updated.currentAllowedCourseId,
      studentProfile: updated.studentProfile,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async resetPassword(
    currentUser: JwtPayload,
    id: string,
    newPassword?: string,
    locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.instituteId;

    const student = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'STUDENT',
        ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      },
    });

    if (!student) {
      throw new NotFoundException(
        this.i18n.t('students.studentNotFound', locale),
      );
    }

    const rawPassword = newPassword?.trim() || student.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
      message: this.i18n.t('students.passwordResetSuccess', locale),
    };
  }

  async addNote(
    currentUser: JwtPayload,
    id: string,
    dto: AddStudentNoteInput,
    locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.instituteId;

    const existing = await this.prisma.user.findFirst({
      where: {
        id,
        role: 'STUDENT',
        ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
      },
      include: {
        studentProfile: {
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        this.i18n.t('students.studentNotFound', locale),
      );
    }

    const profileId =
      existing.studentProfile?.id ??
      (
        await this.prisma.studentProfile.create({
          data: { userId: existing.id },
        })
      ).id;

    await this.prisma.studentNote.create({
      data: {
        studentProfileId: profileId,
        createdByUserId: currentUser.sub,
        content: dto.content,
      },
    });

    return this.findOne(currentUser, id, locale);
  }

  async lookup(
    currentUser: JwtPayload,
    nationalCode?: string,
    phone?: string,
  ): Promise<StudentLookupResponse> {
    const trimmedNationalCode = nationalCode?.trim();
    const trimmedPhone = phone?.trim();

    if (!trimmedNationalCode && !trimmedPhone) {
      return { found: false, student: null };
    }

    const whereOr: Array<{ nationalCode?: string; phone?: string }> = [];
    if (trimmedNationalCode) {
      whereOr.push({ nationalCode: trimmedNationalCode });
    }
    if (trimmedPhone) {
      whereOr.push({ phone: trimmedPhone });
    }

    const users = await this.prisma.user.findMany({
      where: {
        OR: whereOr,
      },
      include: {
        studentProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (users.length === 0) {
      return { found: false, student: null };
    }

    const matchedUser =
      users.find((u) => u.instituteId === currentUser.instituteId) || users[0];

    const profile = matchedUser.studentProfile;

    return {
      found: true,
      student: {
        id: matchedUser.id,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        phone: matchedUser.phone,
        nationalCode: matchedUser.nationalCode,
        avatarUrl: matchedUser.avatarUrl,
        fatherName: profile?.fatherName ?? null,
        birthDate: profile?.birthDate ? profile.birthDate.toISOString() : null,
        gender: profile?.gender ?? null,
        emergencyPhone: profile?.emergencyPhone ?? null,
        address: profile?.address ?? null,
        currentAllowedCourseId: matchedUser.currentAllowedCourseId,
      },
    };
  }
}
