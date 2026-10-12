import { Module } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentCapacityReleaseService } from './enrollment-capacity-release.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentCapacityReleaseService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
