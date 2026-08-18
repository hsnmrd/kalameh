import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@workspace/types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(instituteId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        phone_instituteId: {
          phone: dto.phone,
          instituteId,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'کاربری با این شماره تماس در این آموزشگاه قبلاً ثبت شده است',
      );
    }

    const rawPassword = dto.password || dto.phone;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        instituteId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        password: hashedPassword,
        role: dto.role || 'STUDENT',
        nationalCode: dto.nationalCode,
        currentAllowedCourseId: dto.currentAllowedCourseId,
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async findAll(instituteId: string, role?: Role, search?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        instituteId,
        ...(role ? { role } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOne(instituteId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, instituteId },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        currentAllowedCourse: {
          select: {
            id: true,
            title: true,
            baseFee: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('کاربر مورد نظر یافت نشد');
    }

    return user;
  }

  async update(instituteId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(instituteId, id);

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          instituteId,
          NOT: { id },
        },
      });

      if (existingPhone) {
        throw new ConflictException(
          'این شماره تماس به کاربر دیگری در این آموزشگاه اختصاص یافته است',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName ? { lastName: dto.lastName } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.nationalCode !== undefined
          ? { nationalCode: dto.nationalCode }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.currentAllowedCourseId !== undefined
          ? { currentAllowedCourseId: dto.currentAllowedCourseId }
          : {}),
      },
      select: {
        id: true,
        instituteId: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        nationalCode: true,
        isActive: true,
        currentAllowedCourseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async resetPassword(instituteId: string, id: string, newPassword?: string) {
    const user = await this.findOne(instituteId, id);

    const passwordToSet = newPassword || user.phone;
    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'رمز عبور با موفقیت بازنشانی شد' };
  }
}
