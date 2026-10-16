import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { BookCoursesService } from './book-courses.service';
import { PrismaModule } from '../prisma/prisma.module';
import { I18nModule } from '../i18n/i18n.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, I18nModule, AuditLogsModule],
  controllers: [BooksController],
  providers: [BooksService, BookCoursesService],
  exports: [BooksService, BookCoursesService],
})
export class BooksModule {}
