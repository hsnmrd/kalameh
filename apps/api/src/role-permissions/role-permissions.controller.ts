import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { ResetRolePermissionsDto } from './dto/reset-role-permissions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  PERMISSIONS,
  ROLES,
  type JwtPayload,
  type Role,
  type SupportedLocale,
} from '@workspace/types';

@Controller('role-permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  /**
   * GET /role-permissions?instituteId=...
   * Returns effective permissions for all configurable roles in an institute.
   */
  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_ROLE_PERMISSIONS)
  async getAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') queryInstituteId?: string,
  ) {
    const instituteId =
      currentUser.role === ROLES.SUPER_ADMIN && queryInstituteId
        ? queryInstituteId
        : currentUser.instituteId;

    return this.rolePermissionsService.getAllForInstitute(instituteId);
  }

  /**
   * GET /role-permissions/:role?instituteId=...
   * Returns effective permissions for a specific role in an institute.
   */
  @Get(':role')
  @RequirePermissions(PERMISSIONS.VIEW_ROLE_PERMISSIONS)
  async getOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('role') role: string,
    @Query('instituteId') queryInstituteId?: string,
  ) {
    const instituteId =
      currentUser.role === ROLES.SUPER_ADMIN && queryInstituteId
        ? queryInstituteId
        : currentUser.instituteId;

    return this.rolePermissionsService.getEffectivePermissions(
      role as Role,
      instituteId,
    );
  }

  /**
   * PUT /role-permissions
   * Update permissions for a role in an institute.
   */
  @Put()
  @RequirePermissions(PERMISSIONS.MANAGE_ROLE_PERMISSIONS)
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: UpdateRolePermissionsDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    const instituteId =
      currentUser.role === ROLES.SUPER_ADMIN && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    return this.rolePermissionsService.updateRolePermissions(
      currentUser,
      instituteId,
      dto.role,
      dto.permissions,
      locale,
    );
  }

  /**
   * POST /role-permissions/reset
   * Reset a role's permissions to static defaults.
   */
  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.MANAGE_ROLE_PERMISSIONS)
  async reset(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: ResetRolePermissionsDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    const instituteId =
      currentUser.role === ROLES.SUPER_ADMIN && dto.instituteId
        ? dto.instituteId
        : currentUser.instituteId;

    return this.rolePermissionsService.resetToDefaults(
      instituteId,
      dto.role,
      locale,
    );
  }
}
