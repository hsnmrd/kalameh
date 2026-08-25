import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  PERMISSIONS,
  APP_MODULES,
  type JwtPayload,
  type Role,
  type SupportedLocale,
} from '@workspace/types';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.USERS_STAFF)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('excel-template')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  async getExcelTemplate(
    @CurrentLocale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    const buffer = this.usersService.generateExcelTemplate(locale);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="users-import-template.xlsx"',
    );
    return res.send(buffer);
  }

  @Post('import-excel')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  async importExcel(
    @CurrentUser() currentUser: JwtPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
    @Query('instituteId') instituteId?: string,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException(
        locale === 'fa'
          ? 'لطفاً فایل اکسل معتبر را انتخاب کنید'
          : 'Please select a valid Excel file',
      );
    }
    return this.usersService.importFromExcel(
      currentUser,
      file.buffer,
      locale,
      instituteId,
    );
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateUserDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.create(currentUser, dto, locale);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('instituteId') instituteId?: string,
    @CurrentLocale() locale?: SupportedLocale,
  ) {
    return this.usersService.findAll(
      currentUser,
      role as Role | undefined,
      search,
      locale,
      instituteId,
    );
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_USERS)
  async findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.findOne(currentUser, id, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.update(currentUser, id, dto, locale);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  async resetPassword(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body('newPassword') newPassword: string | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.resetPassword(
      currentUser,
      id,
      newPassword,
      locale,
    );
  }
}
