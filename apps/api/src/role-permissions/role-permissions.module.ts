import { Module } from '@nestjs/common';
import { RolePermissionsController } from './role-permissions.controller';
import { RolePermissionsService } from './role-permissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [PrismaModule, I18nModule],
  controllers: [RolePermissionsController],
  providers: [RolePermissionsService],
  exports: [RolePermissionsService],
})
export class RolePermissionsModule {}
