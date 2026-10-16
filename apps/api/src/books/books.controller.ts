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
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { GenerateCoursesFromBookDto } from './dto/generate-courses.dto';
import { BatchGenerateCoursesDto } from './dto/generate-courses-batch.dto';
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
  type SupportedLocale,
  type BookDto,
  type CourseDto,
} from '@workspace/types';

@Controller('books')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.CLASSES_COURSES)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_BOOKS)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') instituteId?: string,
    @Query('search') search?: string,
  ): Promise<BookDto[]> {
    return this.booksService.findAll(currentUser, instituteId, search);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_BOOKS)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<BookDto & { courses: CourseDto[] }> {
    return this.booksService.findOne(id, currentUser, locale);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_BOOKS)
  async create(
    @Body() dto: CreateBookDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<BookDto> {
    return this.booksService.create(dto, currentUser, locale);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_BOOKS)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<BookDto> {
    return this.booksService.update(id, dto, currentUser, locale);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_BOOKS)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<{ message: string }> {
    return this.booksService.remove(id, currentUser, locale);
  }

  @Post('batch-generate-courses')
  @RequirePermissions(PERMISSIONS.MANAGE_COURSES)
  async batchGenerateCourses(
    @Body() dto: BatchGenerateCoursesDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<CourseDto[]> {
    return this.booksService.generateCoursesBatch(dto, currentUser, locale);
  }

  @Post(':id/generate-courses')
  @RequirePermissions(PERMISSIONS.MANAGE_COURSES)
  async generateCourses(
    @Param('id') id: string,
    @Body() dto: GenerateCoursesFromBookDto,
    @CurrentUser() currentUser: JwtPayload,
    @CurrentLocale() locale: SupportedLocale = 'fa',
  ): Promise<CourseDto[]> {
    return this.booksService.generateCourses(id, dto, currentUser, locale);
  }
}
