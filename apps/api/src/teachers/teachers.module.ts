import { Module } from '@nestjs/common';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { I18nModule } from '../i18n/i18n.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { TeacherAvailabilityService } from './teacher-availability.service';
import { TeacherQualificationsService } from './teacher-qualifications.service';
import { TeacherCreateService } from './teacher-create.service';
import { TeacherLifecycleService } from './teacher-lifecycle.service';
import { TeacherQueryService } from './teacher-query.service';
import { TeacherUpdateService } from './teacher-update.service';

@Module({
  imports: [PrismaModule, I18nModule, AuditLogsModule],
  controllers: [TeachersController],
  providers: [
    TeachersService,
    TeacherAvailabilityService,
    TeacherQualificationsService,
    TeacherCreateService,
    TeacherLifecycleService,
    TeacherQueryService,
    TeacherUpdateService,
  ],
  exports: [TeachersService],
})
export class TeachersModule {}
