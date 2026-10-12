import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseExcelService } from './course-excel.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CourseExcelService],
  exports: [CoursesService, CourseExcelService],
})
export class CoursesModule {}
