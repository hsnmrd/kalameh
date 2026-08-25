import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  JwtPayload,
  DEFAULT_ROLE_PERMISSIONS,
  ROLES,
  type Permission,
  type Role,
} from '@workspace/types';

import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const cookies = req?.cookies as Record<string, string> | undefined;
          if (cookies) {
            return cookies.access_token || cookies.accessToken || null;
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'kalameh-super-secret-jwt-key-2026',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.instituteId) {
      throw new UnauthorizedException('شناسه توکن نامعتبر است');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        institute: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('حساب کاربری یافت نشد یا غیرفعال است');
    }

    if (
      !user.institute ||
      !user.institute.isActive ||
      user.institute.deletedAt
    ) {
      throw new UnauthorizedException('آموزشگاه مربوطه غیرفعال شده است');
    }

    // Resolve effective permissions
    const permissions = await this.resolvePermissions(
      user.role,
      user.instituteId,
    );

    return {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      instituteId: user.instituteId,
      enabledModules: user.institute.enabledModules || [],
      permissions,
    };
  }

  private async resolvePermissions(
    role: Role,
    instituteId: string,
  ): Promise<string[]> {
    // SUPER_ADMIN always has all permissions
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
}
