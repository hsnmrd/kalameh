import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InstitutesService } from './institutes.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import { instituteLogoMulterOptions } from '../common/upload/multer.util';
import {
  PERMISSIONS,
  parseStatusFilter,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('institutes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InstitutesController {
  constructor(private readonly institutesService: InstitutesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_INSTITUTES)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const parsedIsActive = parseStatusFilter(isActive);
    return this.institutesService.findAll(currentUser, search, parsedIsActive);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_INSTITUTES)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_INSTITUTES)
  @UseInterceptors(FileInterceptor('logo', instituteLogoMulterOptions))
  async create(
    @Body() dto: CreateInstituteDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.create(dto, file, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTITUTE_SETTINGS)
  @UseInterceptors(FileInterceptor('logo', instituteLogoMulterOptions))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstituteDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.update(id, dto, file, currentUser, locale);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_INSTITUTES)
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.delete(id, currentUser, locale);
  }
}
