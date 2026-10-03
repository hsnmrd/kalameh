import { Module } from '@nestjs/common';
import { ClassRequirementsController } from './class-requirements.controller';
import { ClassRequirementsService } from './class-requirements.service';

@Module({
  controllers: [ClassRequirementsController],
  providers: [ClassRequirementsService],
  exports: [ClassRequirementsService],
})
export class ClassRequirementsModule {}
