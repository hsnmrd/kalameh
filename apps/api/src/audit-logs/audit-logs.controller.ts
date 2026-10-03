import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogFilterDto } from './dto/audit-log-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PERMISSIONS, type JwtPayload } from '@workspace/types';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_AUDIT_LOGS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() filter: AuditLogFilterDto,
  ) {
    return this.auditLogsService.findAll(currentUser, filter);
  }

  @Get('entity/:module/:entityId')
  @RequirePermissions(PERMISSIONS.VIEW_AUDIT_LOGS)
  async findByEntity(
    @CurrentUser() currentUser: JwtPayload,
    @Param('module') module: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogsService.findByEntity(currentUser, module, entityId);
  }
}
