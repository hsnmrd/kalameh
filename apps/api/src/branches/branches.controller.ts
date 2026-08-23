import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  PERMISSIONS,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('branches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_BRANCHES)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
  ) {
    return this.branchesService.findAll(currentUser, targetInstituteId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_BRANCHES)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.branchesService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_BRANCHES)
  async create(
    @Body() dto: CreateBranchDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.branchesService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_BRANCHES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.branchesService.update(id, dto, currentUser, locale);
  }
}
