import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  Role,
  JwtPayload,
  SupportedLocale,
  UserImportRowSchema,
  type ExcelImportResult,
  type ExcelImportError,
} from '@workspace/types';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
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

    // RBAC: Non-super-admins cannot create SUPER_ADMIN accounts
    if (currentUser.role === 'ADMIN') {
      if (dto.role === 'SUPER_ADMIN') {
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
    } else if (currentUser.role === 'ADMIN') {
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
    const user = await this.prisma.user.findFirstOrThrow({
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

    // RBAC: Non-super-admins cannot promote/change user to SUPER_ADMIN
    if (currentUser.role !== 'SUPER_ADMIN' && dto.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('users.cannotEditSuperAdmin', locale),
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
        ...(dto.role ? { role: dto.role } : {}),
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

  generateExcelTemplate(locale: SupportedLocale = 'fa'): Buffer {
    return this.excelService.generateUserTemplate(locale);
  }

  async importFromExcel(
    currentUser: JwtPayload,
    fileBuffer: Buffer,
    locale: SupportedLocale = 'fa',
    instituteId?: string,
  ): Promise<ExcelImportResult> {
    const targetInstituteId =
      currentUser.role === 'SUPER_ADMIN' && instituteId
        ? instituteId
        : currentUser.instituteId;

    if (!targetInstituteId) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('users.unauthorizedUserCreation', locale),
      );
    }

    const rawRows = this.excelService.parseUserRows(fileBuffer, locale);
    if (rawRows.length === 0) {
      return {
        totalRows: 0,
        importedCount: 0,
        failedCount: 0,
        errors: [
          {
            row: 1,
            message:
              this.i18n.t('users.emptyImportFile', locale) ||
              'فایل اکسل خالی است یا ساختار نامعتبر دارد',
          },
        ],
      };
    }

    // Preload existing branches for this institute
    const branches = await this.prisma.branch.findMany({
      where: { instituteId: targetInstituteId },
      select: { id: true, name: true },
    });

    const branchMap = new Map<string, string>();
    branches.forEach((b) => branchMap.set(b.name.trim().toLowerCase(), b.id));

    // Preload existing phone numbers for this institute
    const existingUsers = await this.prisma.user.findMany({
      where: { instituteId: targetInstituteId },
      select: { phone: true },
    });
    const existingPhones = new Set(existingUsers.map((u) => u.phone));

    const seenPhonesInBatch = new Set<string>();
    const validRowsToInsert: Array<{
      instituteId: string;
      branchId?: string;
      firstName: string;
      lastName: string;
      phone: string;
      nationalCode?: string;
      role: Role;
      password: string;
    }> = [];

    const errors: ExcelImportError[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2; // 1-indexed (Row 1 is headers)
      const raw = rawRows[i];

      const parseResult = UserImportRowSchema.safeParse(raw);
      if (!parseResult.success) {
        const errorMsg = parseResult.error.errors
          .map((e) => e.message)
          .join('، ');
        errors.push({
          row: rowNumber,
          phone: raw.phone || undefined,
          message: errorMsg,
        });
        continue;
      }

      const row = parseResult.data;

      // Check RBAC role restrictions
      if (currentUser.role !== 'SUPER_ADMIN' && row.role === 'SUPER_ADMIN') {
        errors.push({
          row: rowNumber,
          phone: row.phone,
          message: this.i18n.t('users.instituteAdminAllowedRolesOnly', locale),
        });
        continue;
      }

      // Check batch duplicates
      if (seenPhonesInBatch.has(row.phone)) {
        errors.push({
          row: rowNumber,
          phone: row.phone,
          message: `شماره موبایل ${row.phone} در این فایل تکراری است`,
        });
        continue;
      }

      // Check database duplicates
      if (existingPhones.has(row.phone)) {
        errors.push({
          row: rowNumber,
          phone: row.phone,
          message: this.i18n.t('users.userAlreadyExists', locale),
        });
        continue;
      }

      seenPhonesInBatch.add(row.phone);

      // Resolve branch if provided
      let branchId: string | undefined = undefined;
      if (row.branchName) {
        const matchedId = branchMap.get(row.branchName.trim().toLowerCase());
        if (matchedId) {
          branchId = matchedId;
        }
      }

      const rawPassword = row.password || row.phone;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      validRowsToInsert.push({
        instituteId: targetInstituteId,
        branchId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        nationalCode: row.nationalCode || undefined,
        role: row.role as Role,
        password: hashedPassword,
      });
    }

    if (validRowsToInsert.length > 0) {
      await this.prisma.user.createMany({
        data: validRowsToInsert,
      });
    }

    return {
      totalRows: rawRows.length,
      importedCount: validRowsToInsert.length,
      failedCount: errors.length,
      errors,
    };
  }
}
