import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponse, JwtPayload } from '@workspace/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private excludePassword<T extends { password?: string }>(
    user: T,
  ): Omit<T, 'password'> {
    const safeUser = { ...user };
    delete (safeUser as { password?: string }).password;
    return safeUser;
  }

  async login(
    dto: LoginDto,
    headerInstituteIdentifier?: string,
  ): Promise<AuthResponse> {
    const subdomain = dto.subdomain || headerInstituteIdentifier;

    let instituteId: string | undefined;

    if (subdomain) {
      const institute = await this.prisma.institute.findFirst({
        where: {
          OR: [{ subdomain: subdomain }, { id: subdomain }],
        },
      });

      if (!institute) {
        throw new NotFoundException('آموزشگاه مورد نظر یافت نشد');
      }

      if (!institute.isActive) {
        throw new UnauthorizedException('دسترسی این آموزشگاه مسدود شده است');
      }

      instituteId = institute.id;
    }

    // If instituteId was not specified via subdomain/header, find user by phone
    const users = await this.prisma.user.findMany({
      where: {
        phone: dto.phone,
        ...(instituteId ? { instituteId } : {}),
      },
      include: {
        institute: true,
      },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    // If phone exists in multiple institutes and no institute was specified
    if (users.length > 1 && !instituteId) {
      throw new BadRequestException(
        'این شماره در چند آموزشگاه ثبت شده است. لطفاً شناسه یا زیردامنه آموزشگاه را وارد کنید',
      );
    }

    const user = users[0];

    if (!user.isActive) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال شده است');
    }

    if (!user.institute || !user.institute.isActive) {
      throw new UnauthorizedException('آموزشگاه شما غیرفعال شده است');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
      instituteId: user.instituteId,
    };

    const accessToken = this.jwtService.sign(payload);
    const safeUser = this.excludePassword(user);

    return {
      accessToken,
      user: safeUser,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        institute: true,
        currentAllowedCourse: true,
      },
    });

    return this.excludePassword(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('رمز عبور فعلی نادرست است');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'رمز عبور با موفقیت به‌روزرسانی شد' };
  }
}
