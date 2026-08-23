import { Module } from '@nestjs/common';
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
import { GradesModule } from './grades/grades.module';
import { StudentsModule } from './students/students.module';
import { I18nModule } from './i18n/i18n.module';
import { RolePermissionsModule } from './role-permissions/role-permissions.module';

@Module({
  imports: [
    I18nModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    InstitutesModule,
    BranchesModule,
    TermsModule,
    CoursesModule,
    ClassesModule,
    GradesModule,
    RolePermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
