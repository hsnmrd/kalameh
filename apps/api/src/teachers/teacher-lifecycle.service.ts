import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ROLES, type JwtPayload, type SupportedLocale } from '@workspace/types';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AuditLogsService,
  ) {}
  async resetPassword(
    currentUser: JwtPayload,
    id: string,
    newPassword?: string,
    _locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
    });

    const rawPassword = newPassword?.trim() || teacher.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await this.prisma.user.update({
      where: {
        id,
        instituteId: teacher.instituteId,
      },
      data: { password: hashedPassword },
    });

    await this.auditLogsService.log({
      instituteId: teacher.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_PASSWORD_RESET',
      entityId: id,
      metadata: { phone: teacher.phone },
    });

    return { success: true };
  }

  async remove(
    currentUser: JwtPayload,
    id: string,
    _locale: SupportedLocale = 'fa',
  ) {
    const teacher = await this.prisma.user.findFirstOrThrow({
      where: {
        id,
        role: ROLES.TEACHER,
        ...(currentUser.role === ROLES.SUPER_ADMIN
          ? {}
          : { instituteId: currentUser.instituteId }),
      },
      include: {
        _count: {
          select: { teachingClasses: true },
        },
      },
    });

    if (teacher._count.teachingClasses > 0) {
      // Soft-deactivate if classes are associated
      await this.prisma.user.update({
        where: {
          id,
          instituteId: teacher.instituteId,
        },
        data: { isActive: false },
      });
      return { success: true, deactivated: true };
    }

    await this.prisma.user.delete({
      where: {
        id,
        instituteId: teacher.instituteId,
      },
    });

    await this.auditLogsService.log({
      instituteId: teacher.instituteId,
      userId: currentUser.sub,
      module: 'TEACHER',
      action: 'TEACHER_DELETED',
      entityId: id,
      metadata: { phone: teacher.phone },
    });

    return { success: true, deleted: true };
  }
}
