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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import {
  PERMISSIONS,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('classes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() filter: ClassFilterDto,
  ) {
    return this.classesService.findAll(currentUser, filter);
  }

  @Get('available')
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  async findAvailableForStudent(@CurrentUser() currentUser: JwtPayload) {
    return this.classesService.findAvailableForStudent(currentUser);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_CLASSES)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classesService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  async create(
    @Body() dto: CreateClassDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classesService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_CLASSES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    return this.classesService.update(id, dto, currentUser, locale);
  }
}
