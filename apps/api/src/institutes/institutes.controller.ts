import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InstitutesService } from './institutes.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import { UploadedFileType } from '../common/types/uploaded-file.type';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('institutes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstitutesController {
  constructor(private readonly institutesService: InstitutesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async findAll(@CurrentUser() currentUser: JwtPayload) {
    return this.institutesService.findAll(currentUser);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.findOne(id, currentUser, locale);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  async create(
    @Body() dto: CreateInstituteDto,
    @UploadedFile() file: UploadedFileType | undefined,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.create(dto, file, currentUser, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInstituteDto,
    @UploadedFile() file: UploadedFileType | undefined,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.institutesService.update(id, dto, file, currentUser, locale);
  }
}
