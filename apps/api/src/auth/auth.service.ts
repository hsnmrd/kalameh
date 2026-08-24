import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  AuthResponse,
  JwtPayload,
  SupportedLocale,
  ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from '@workspace/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  private excludePassword<T extends { password?: string }>(
    user: T,
  ): Omit<T, 'password'> {
    const safeUser = { ...user };
    delete (safeUser as { password?: string }).password;
    return safeUser;
  }

  private async resolvePermissions(
    role: Role,
    instituteId: string,
  ): Promise<string[]> {
    if (role === ROLES.SUPER_ADMIN) {
      return [];
    }

    if (this.prisma.rolePermission) {
      const override = await this.prisma.rolePermission.findUnique({
        where: {
          instituteId_role: { instituteId, role },
        },
      });

      if (override) {
        return override.permissions;
      }
    }

    return [
      ...((DEFAULT_ROLE_PERMISSIONS[role] as readonly Permission[]) || []),
    ];
  }

  async login(
    dto: LoginDto,
    headerInstituteIdentifier?: string,
    locale: SupportedLocale = 'fa',
  ): Promise<AuthResponse> {
    const subdomain = dto.subdomain || headerInstituteIdentifier;

    let instituteId: string | undefined;

    if (subdomain) {
      const institute = await this.prisma.institute.findFirstOrThrow({
        where: {
          OR: [{ subdomain: subdomain }, { id: subdomain }],
        },
      });

      if (!institute.isActive) {
        throw new UnauthorizedException(
          this.i18n.t('auth.instituteBlocked', locale),
        );
      }

      instituteId = institute.id;
    }

    // If instituteId was not specified via subdomain/header, find user by phone
    const users = await this.prisma.user.findMany({
      where: {
        phone: dto.phone,
        ...(instituteId ? { instituteId } : {}),
      },
      include: {
        institute: true,
      },
    });

    if (users.length === 0) {
      throw new UnauthorizedException(
        this.i18n.t('auth.invalidCredentials', locale),
      );
    }

    // If phone exists in multiple institutes and no institute was specified
    if (users.length > 1 && !instituteId) {
      throw new BadRequestException(
        this.i18n.t('auth.multipleInstitutesFound', locale),
      );
    }

    const user = users[0];

    if (!user.isActive) {
      throw new UnauthorizedException(
        this.i18n.t('auth.userDeactivated', locale),
      );
    }

    if (!user.institute || !user.institute.isActive) {
      throw new UnauthorizedException(
        this.i18n.t('auth.instituteDeactivated', locale),
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('auth.invalidCredentials', locale),
      );
    }

    // Resolve effective permissions for this user's role + institute
    const permissions = await this.resolvePermissions(
      user.role,
      user.instituteId,
    );

    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      instituteId: user.instituteId,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);
    const safeUser = this.excludePassword(user);

    return {
      accessToken,
      user: {
        ...safeUser,
        permissions,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        institute: true,
        currentAllowedCourse: true,
      },
    });

    const permissions = await this.resolvePermissions(
      user.role,
      user.instituteId,
    );

    return {
      ...this.excludePassword(user),
      permissions,
    };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    locale: SupportedLocale = 'fa',
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('auth.invalidCurrentPassword', locale),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: this.i18n.t('auth.passwordChangedSuccess', locale),
    };
  }
}
