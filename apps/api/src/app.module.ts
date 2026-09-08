import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutesModule } from './institutes/institutes.module';
import { BranchesModule } from './branches/branches.module';
import { TermsModule } from './terms/terms.module';
import { CoursesModule } from './courses/courses.module';
import { ClassesModule } from './classes/classes.module';
import { ClassroomsModule } from './classrooms/classrooms.module';
import { GradesModule } from './grades/grades.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { I18nModule } from './i18n/i18n.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';
import { ExcelModule } from './common/excel/excel.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TransactionsModule } from './transactions/transactions.module';
import { ClassRequirementsModule } from './class-requirements/class-requirements.module';

@Module({
  imports: [
    I18nModule,
    PrismaModule,
    ExcelModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    InstitutesModule,
    BranchesModule,
    TermsModule,
    CoursesModule,
    ClassesModule,
    ClassroomsModule,
    GradesModule,
    RolePermissionsModule,
    AuditLogsModule,
    TransactionsModule,
    ClassRequirementsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule {}
