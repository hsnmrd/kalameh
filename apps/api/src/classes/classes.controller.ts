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
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassFilterDto } from './dto/class-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import type { JwtPayload, SupportedLocale } from '@workspace/types';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() filter: ClassFilterDto,
  ) {
    return this.classesService.findAll(currentUser, filter);
  }

  @Get('available')
  @Roles('STUDENT', 'INSTITUTE_ADMIN', 'CLERK', 'SUPER_ADMIN')
  async findAvailableForStudent(@CurrentUser() currentUser: JwtPayload) {
    return this.classesService.findAvailableForStudent(currentUser);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'CLERK', 'STUDENT')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classesService.findOne(id, currentUser, locale);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async create(
    @Body() dto: CreateClassDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classesService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'INSTITUTE_ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classesService.update(id, dto, currentUser, locale);
  }
}
