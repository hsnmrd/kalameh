import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import {
  Role,
  Permission,
  ROLES,
  PERMISSIONS,
  DEFAULT_ROLE_PERMISSIONS,
  CONFIGURABLE_ROLES,
  type JwtPayload,
  type SupportedLocale,
  type RolePermissionResponse,
} from '@workspace/types';

const ALL_PERMISSION_VALUES = Object.values(PERMISSIONS) as string[];

@Injectable()
export class RolePermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Resolve effective permissions for a role in an institute.
   * Returns DB override if it exists, otherwise static defaults.
   */
  async getEffectivePermissions(
    role: Role,
    instituteId: string,
  ): Promise<RolePermissionResponse> {
    if (role === ROLES.SUPER_ADMIN) {
      return {
        role,
        permissions: ALL_PERMISSION_VALUES,
        isOverridden: false,
      };
    }

    const override = await this.prisma.rolePermission.findUnique({
      where: {
        instituteId_role: { instituteId, role },
      },
    });

    if (override) {
      return {
        role,
        permissions: override.permissions,
        isOverridden: true,
      };
    }

    return {
      role,
      permissions: [
        ...((DEFAULT_ROLE_PERMISSIONS[role] as readonly Permission[]) || []),
      ],
      isOverridden: false,
    };
  }

  /**
   * Get effective permissions for all configurable roles in an institute.
   */
  async getAllForInstitute(
    instituteId: string,
  ): Promise<RolePermissionResponse[]> {
    const results: RolePermissionResponse[] = [];

    for (const role of CONFIGURABLE_ROLES) {
      const result = await this.getEffectivePermissions(role, instituteId);
      results.push(result);
    }

    return results;
  }

  /**
   * Update permissions for a role in an institute.
   * Includes escalation prevention — caller cannot assign permissions they don't have.
   */
  async updateRolePermissions(
    currentUser: JwtPayload,
    instituteId: string,
    role: Role,
    permissions: string[],
    locale: SupportedLocale = 'fa',
  ): Promise<RolePermissionResponse> {
    // Cannot modify SUPER_ADMIN permissions
    if (role === ROLES.SUPER_ADMIN) {
      throw new BadRequestException(this.i18n.t('common.forbidden', locale));
    }

    // Validate that all provided permissions are valid
    const invalidPermissions = permissions.filter(
      (p) => !ALL_PERMISSION_VALUES.includes(p),
    );
    if (invalidPermissions.length > 0) {
      throw new BadRequestException(
        `Invalid permissions: ${invalidPermissions.join(', ')}`,
      );
    }

    // Escalation prevention: non-SUPER_ADMIN users cannot assign permissions they don't have
    if (currentUser.role !== ROLES.SUPER_ADMIN) {
      const callerPermissions = currentUser.permissions || [];
      const escalated = permissions.filter(
        (p) => !callerPermissions.includes(p),
      );
      if (escalated.length > 0) {
        throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
      }
    }

    // Validate role is configurable
    if (!CONFIGURABLE_ROLES.includes(role)) {
      throw new BadRequestException(this.i18n.t('common.forbidden', locale));
    }

    const result = await this.prisma.rolePermission.upsert({
      where: {
        instituteId_role: { instituteId, role },
      },
      update: {
        permissions,
      },
      create: {
        instituteId,
        role,
        permissions,
      },
    });

    return {
      role: result.role,
      permissions: result.permissions,
      isOverridden: true,
    };
  }

  /**
   * Reset a role's permissions to static defaults by removing the DB override.
   */
  async resetToDefaults(
    instituteId: string,
    role: Role,
    locale: SupportedLocale = 'fa',
  ): Promise<RolePermissionResponse> {
    if (role === ROLES.SUPER_ADMIN) {
      throw new BadRequestException(this.i18n.t('common.forbidden', locale));
    }

    // Delete the override if it exists
    await this.prisma.rolePermission
      .delete({
        where: {
          instituteId_role: { instituteId, role },
        },
      })
      .catch(() => {
        // No override exists — that's fine
      });

    return {
      role,
      permissions: [
        ...((DEFAULT_ROLE_PERMISSIONS[role] as readonly Permission[]) || []),
      ],
      isOverridden: false,
    };
  }
}
