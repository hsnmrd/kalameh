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
import { TermsService } from './terms.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
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

@Controller('terms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_TERMS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
  ) {
    return this.termsService.findAll(currentUser, targetInstituteId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_TERMS)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_TERMS)
  async create(
    @Body() dto: CreateTermDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_TERMS)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTermDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.update(id, dto, currentUser, locale);
  }
}
