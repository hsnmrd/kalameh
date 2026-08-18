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
import type { Role } from '@workspace/types';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async create(
    @CurrentUser('instituteId') instituteId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(instituteId, dto);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async findAll(
    @CurrentUser('instituteId') instituteId: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(
      instituteId,
      role as Role | undefined,
      search,
    );
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK')
  async findOne(
    @CurrentUser('instituteId') instituteId: string,
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(instituteId, id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async update(
    @CurrentUser('instituteId') instituteId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(instituteId, id, dto);
  }

  @Post(':id/reset-password')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async resetPassword(
    @CurrentUser('instituteId') instituteId: string,
    @Param('id') id: string,
    @Body('newPassword') newPassword?: string,
  ) {
    return this.usersService.resetPassword(instituteId, id, newPassword);
  }
}
