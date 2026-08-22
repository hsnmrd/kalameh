import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role, JwtPayload, SupportedLocale } from '@workspace/types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(
    currentUser: JwtPayload,
    dto: CreateUserDto,
    locale: SupportedLocale = 'fa',
  ) {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    // RBAC: Non-super-admins cannot create SUPER_ADMIN or INSTITUTE_ADMIN accounts
    if (currentUser.role === 'INSTITUTE_ADMIN') {
      if (dto.role === 'SUPER_ADMIN' || dto.role === 'INSTITUTE_ADMIN') {
        throw new ForbiddenException(
          this.i18n.t('users.instituteAdminAllowedRolesOnly', locale),
        );
      }
    } else if (currentUser.role === 'CLERK') {
      if (dto.role && dto.role !== 'STUDENT') {
        throw new ForbiddenException(
          this.i18n.t('users.clerkAllowedRolesOnly', locale),
        );
      }
    } else if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('users.unauthorizedUserCreation', locale),
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
        this.i18n.t('users.userAlreadyExists', locale),
      );
    }

    const rawPassword = dto.password || dto.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        instituteId: targetInstituteId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role || 'STUDENT',
        nationalCode: dto.nationalCode,
        currentAllowedCourseId: dto.currentAllowedCourseId,
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(
    currentUser: JwtPayload,
    role?: Role,
    search?: string,
    locale: SupportedLocale = 'fa',
    instituteId?: string,
  ) {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' && instituteId
        ? instituteId
        : currentUser.instituteId;

    let roleFilter: Role | { not: 'SUPER_ADMIN' } | { in: Role[] } | undefined;

    if (currentUser.role === 'SUPER_ADMIN') {
      roleFilter = role;
    } else if (currentUser.role === 'INSTITUTE_ADMIN') {
      // Institute Admin can never view SUPER_ADMIN accounts
      if (role === 'SUPER_ADMIN') {
        return [];
      }
      roleFilter = role ? role : { not: 'SUPER_ADMIN' };
    } else if (currentUser.role === 'CLERK') {
      // Clerk can only view STUDENT accounts
      if (role && role !== 'STUDENT') {
        return [];
      }
      roleFilter = 'STUDENT';
    } else {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const users = await this.prisma.user.findMany({
      where: {
        instituteId: targetInstituteId,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOne(
    currentUser: JwtPayload,
    id: string,
    locale: SupportedLocale = 'fa',
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN'
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
        isActive: true,
        currentAllowedCourseId: true,
        currentAllowedCourse: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('users.userNotFound', locale));
    }

    // RBAC check on target user
    if (currentUser.role !== 'SUPER_ADMIN' && user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('users.cannotAccessSuperAdmin', locale),
      );
    }

    if (currentUser.role === 'CLERK' && user.role !== 'STUDENT') {
      throw new ForbiddenException(
        this.i18n.t('users.clerkAccessStudentOnly', locale),
      );
    }

    return user;
  }

  async update(
    currentUser: JwtPayload,
    id: string,
    dto: UpdateUserDto,
    locale: SupportedLocale = 'fa',
  ) {
    const targetUser = await this.findOne(currentUser, id, locale);

    // RBAC: Non-super-admins cannot update SUPER_ADMIN
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      targetUser.role === 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        this.i18n.t('users.cannotEditSuperAdmin', locale),
      );
    }

    // RBAC: Clerk can only update STUDENT
    if (currentUser.role === 'CLERK' && targetUser.role !== 'STUDENT') {
      throw new ForbiddenException(
        this.i18n.t('users.clerkEditStudentOnly', locale),
      );
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          instituteId: targetUser.instituteId,
          NOT: { id },
        },
      });

      if (existingPhone) {
        throw new ConflictException(
          this.i18n.t('users.phoneAlreadyInUse', locale),
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName ? { lastName: dto.lastName } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.nationalCode !== undefined
          ? { nationalCode: dto.nationalCode }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.currentAllowedCourseId !== undefined
          ? { currentAllowedCourseId: dto.currentAllowedCourseId }
          : {}),
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async resetPassword(
    currentUser: JwtPayload,
    id: string,
    newPassword?: string,
    locale: SupportedLocale = 'fa',
  ) {
    const targetUser = await this.findOne(currentUser, id, locale);

    // RBAC: Non-super-admins cannot reset password of SUPER_ADMIN
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      targetUser.role === 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        this.i18n.t('users.cannotResetSuperAdminPassword', locale),
      );
    }

    // RBAC: Clerk can only reset password of STUDENT
    if (currentUser.role === 'CLERK' && targetUser.role !== 'STUDENT') {
      throw new ForbiddenException(
        this.i18n.t('users.clerkResetStudentPasswordOnly', locale),
      );
    }

    const passwordToSet = newPassword || targetUser.phone;
    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: this.i18n.t('users.passwordResetSuccess', locale) };
  }
}
