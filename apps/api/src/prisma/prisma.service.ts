import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { prisma } from '@workspace/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get institute() {
    return prisma.institute;
  }

  get user() {
    return prisma.user;
  }

  get course() {
    return prisma.course;
  }

  get term() {
    return prisma.term;
  }

  get class() {
    return prisma.class;
  }

  get enrollment() {
    return prisma.enrollment;
  }

  get transaction() {
    return prisma.transaction;
  }

  get client() {
    return prisma;
  }

  async onModuleInit() {
    await prisma.$connect();
  }

  async onModuleDestroy() {
    await prisma.$disconnect();
  }
}
