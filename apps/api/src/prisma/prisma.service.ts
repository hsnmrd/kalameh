import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma, Prisma } from '@workspace/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get institute(): typeof prisma.institute {
    return prisma.institute;
  }

  get branch(): typeof prisma.branch {
    return prisma.branch;
  }

  get user(): typeof prisma.user {
    return prisma.user;
  }

  get course(): typeof prisma.course {
    return prisma.course;
  }

  get term(): typeof prisma.term {
    return prisma.term;
  }

  get class(): typeof prisma.class {
    return prisma.class;
  }

  get enrollment(): typeof prisma.enrollment {
    return prisma.enrollment;
  }

  get transaction(): typeof prisma.transaction {
    return prisma.transaction;
  }

  get rolePermission(): typeof prisma.rolePermission {
    return prisma.rolePermission;
  }

  get studentProfile(): typeof prisma.studentProfile {
    return prisma.studentProfile;
  }

  get studentNote(): typeof prisma.studentNote {
    return prisma.studentNote;
  }

  get auditLog(): typeof prisma.auditLog {
    return prisma.auditLog;
  }

  get client(): typeof prisma {
    return prisma;
  }

  $transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(fn);
  }

  async onModuleInit() {
    await prisma.$connect();
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }
}
