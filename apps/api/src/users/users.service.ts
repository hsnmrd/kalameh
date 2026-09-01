import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { ExcelService } from '../common/excel/excel.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import {
  Role,
  ROLES,
  STAFF_ROLES,
  STUDENT_ROLES,
  JwtPayload,
  SupportedLocale,
  UserImportRowSchema,
  type ExcelImportResult,
  type ExcelImportError,
  type UserLookupResponse,
} from '@workspace/types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly excelService: ExcelService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async create(
    currentUser: JwtPayload,
    dto: CreateUserDto,
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
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
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
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `User created: "${user.firstName} ${user.lastName}" (${user.id}) with role ${user.role} for institute ${targetInstituteId} by user ${currentUser.sub} (${currentUser.role})`,
    );

    await this.auditLogsService.log({
      instituteId: targetInstituteId,
      userId: currentUser.sub,
      module: 'USER',
      entityId: user.id,
      action: 'CREATE',
      metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
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

    let roleFilter: Role | { in: Role[] } | { notIn: Role[] } | undefined;

    if (currentUser.role === ROLES.SUPER_ADMIN) {
      roleFilter = role ? role : { notIn: STUDENT_ROLES };
    } else if (currentUser.role === ROLES.ADMIN) {
      // Institute Admin can only view staff/personnel accounts in /users (students are managed in /students)
      if (
        role === ROLES.SUPER_ADMIN ||
        role === ROLES.STUDENT ||
        role === ROLES.SUPER_STUDENT
      ) {
        return [];
      }
      roleFilter = role ? role : { in: STAFF_ROLES };
    } else if (currentUser.role === ROLES.CLERK) {
      if (
        role &&
        (role === ROLES.SUPER_ADMIN ||
          role === ROLES.STUDENT ||
          role === ROLES.SUPER_STUDENT)
      ) {
        return [];
      }
      roleFilter = role ? role : { in: STAFF_ROLES };
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
        avatarUrl: true,
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
        avatarUrl: true,
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
    file?: Express.Multer.File,
  ) {
    const avatarUrl = file
      ? `/uploads/avatars/${file.filename}`
      : dto.avatarUrl;

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
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
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
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await this.auditLogsService.log({
      instituteId: targetUser.instituteId,
      userId: currentUser.sub,
      module: 'USER',
      entityId: updated.id,
      action: 'UPDATE',
      metadata: dto as unknown as Record<string, unknown>,
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

  async delete(
    currentUser: JwtPayload,
    id: string,
    locale: SupportedLocale = 'fa',
  ): Promise<{ message: string }> {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      throw new NotFoundException(this.i18n.t('users.userNotFound', locale));
    }

    if (currentUser.sub === targetUser.id) {
      throw new BadRequestException(
        this.i18n.t('users.cannotDeleteSelf', locale),
      );
    }

    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      targetUser.instituteId !== currentUser.instituteId
    ) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        this.i18n.t('users.cannotDeleteSuperAdmin', locale),
      );
    }

    // Check for dependent records that would break referential integrity
    const [enrollmentsCount, transactionsCount] = await Promise.all([
      this.prisma.enrollment.count({ where: { studentId: id } }),
      this.prisma.transaction.count({ where: { studentId: id } }),
    ]);

    if (enrollmentsCount > 0 || transactionsCount > 0) {
      throw new BadRequestException(
        this.i18n.t('users.cannotDeleteWithDependencies', locale),
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    await this.auditLogsService.log({
      instituteId: targetUser.instituteId,
      userId: currentUser.sub,
      module: 'USER',
      entityId: targetUser.id,
      action: 'DELETE',
      metadata: {
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        phone: targetUser.phone,
        role: targetUser.role,
      },
    });

    return { message: this.i18n.t('users.userDeletedSuccess', locale) };
  }

  generateExcelTemplate(locale: SupportedLocale = 'fa'): Buffer {
    return this.excelService.generateUserTemplate(locale);
  }

  async exportToExcel(
    currentUser: JwtPayload,
    role?: Role,
    search?: string,
    locale: SupportedLocale = 'fa',
    instituteId?: string,
  ): Promise<Buffer> {
    const users = await this.findAll(
      currentUser,
      role,
      search,
      locale,
      instituteId,
    );

    return this.excelService.exportUsers(users, locale);
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
        role: row.role,
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

  async lookup(
    currentUser: JwtPayload,
    nationalCode?: string,
    phone?: string,
  ): Promise<UserLookupResponse> {
    const trimmedNationalCode = nationalCode?.trim();
    const trimmedPhone = phone?.trim();

    if (!trimmedNationalCode && !trimmedPhone) {
      return { found: false, user: null };
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
      return { found: false, user: null };
    }

    const matchedUser =
      users.find((u) => u.instituteId === currentUser.instituteId) || users[0];

    const profile = matchedUser.studentProfile;

    return {
      found: true,
      user: {
        id: matchedUser.id,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        phone: matchedUser.phone,
        nationalCode: matchedUser.nationalCode,
        role: matchedUser.role,
        fatherName: profile?.fatherName ?? null,
        birthDate: profile?.birthDate ? profile.birthDate.toISOString() : null,
        gender: profile?.gender ?? null,
        emergencyPhone: profile?.emergencyPhone ?? null,
        address: profile?.address ?? null,
      },
    };
  }
}
