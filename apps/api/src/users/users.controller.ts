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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, Role, SupportedLocale } from '@workspace/types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateUserDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.create(currentUser, dto, locale);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
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
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async findOne(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.findOne(currentUser, id, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async update(
    @CurrentUser() currentUser: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.usersService.update(currentUser, id, dto, locale);
  }

  @Post(':id/reset-password')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
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
