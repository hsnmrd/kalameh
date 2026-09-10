import { Module } from '@nestjs/common';
import { OperatingPhasesController } from './operating-phases.controller';
import { OperatingPhasesService } from './operating-phases.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [PrismaModule, AuditLogsModule, I18nModule],
  controllers: [OperatingPhasesController],
  providers: [OperatingPhasesService],
  exports: [OperatingPhasesService],
})
export class OperatingPhasesModule {}
