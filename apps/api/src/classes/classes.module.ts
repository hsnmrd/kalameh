import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassScheduleConflicts } from './class-schedule-conflicts';
import { ClassCreateService } from './class-create.service';
import { ClassLifecycleService } from './class-lifecycle.service';
import { ClassQueryService } from './class-query.service';
import { ClassUpdateService } from './class-update.service';

@Module({
  controllers: [ClassesController],
  providers: [
    ClassesService,
    ClassScheduleConflicts,
    ClassCreateService,
    ClassLifecycleService,
    ClassQueryService,
    ClassUpdateService,
  ],
  exports: [ClassesService],
})
export class ClassesModule {}
