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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('terms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
  ) {
    return this.termsService.findAll(currentUser, targetInstituteId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.findOne(id, currentUser, locale);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async create(
    @Body() dto: CreateTermDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTermDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.termsService.update(id, dto, currentUser, locale);
  }
}
