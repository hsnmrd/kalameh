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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
  ) {
    return this.branchesService.findAll(currentUser, targetInstituteId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.branchesService.findOne(id, currentUser, locale);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async create(
    @Body() dto: CreateBranchDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.branchesService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.branchesService.update(id, dto, currentUser, locale);
  }
}
