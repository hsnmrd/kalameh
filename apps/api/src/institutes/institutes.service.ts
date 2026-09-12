import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { CreateInstituteCustomOffDayDto } from './dto/create-institute-custom-off-day.dto';
import { JwtPayload, SupportedLocale } from '@workspace/types';

@Injectable()
export class InstitutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(currentUser: JwtPayload, search?: string, isActive?: boolean) {
    if (currentUser.role !== 'SUPER_ADMIN') {
      const { _count, ...institute } =
        await this.prisma.institute.findFirstOrThrow({
          where: {
            id: currentUser.instituteId,
            deletedAt: null,
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { subdomain: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {}),
            ...(isActive !== undefined ? { isActive } : {}),
          },
          include: {
            _count: { select: { classes: true, users: true } },
          },
        });

      return [
        {
          ...institute,
          classesCount: _count.classes,
          usersCount: _count.users,
        },
      ];
    }

    const institutes = await this.prisma.institute.findMany({
      where: {
        subdomain: { not: 'system' },
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { subdomain: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        _count: { select: { classes: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return institutes.map(({ _count, ...inst }) => ({
      ...inst,
      classesCount: _count.classes,
      usersCount: _count.users,
    }));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.instituteId !== id) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const { _count, ...institute } =
      await this.prisma.institute.findFirstOrThrow({
        where: { id, deletedAt: null },
        include: {
          _count: {
            select: { classes: true, users: true, courses: true, terms: true },
          },
        },
      });

    return {
      ...institute,
      classesCount: _count.classes,
      usersCount: _count.users,
      coursesCount: _count.courses,
      termsCount: _count.terms,
    };
  }

  async create(
    dto: CreateInstituteDto,
    file: Express.Multer.File | undefined,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const existing = await this.prisma.institute.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('institutes.subdomainAlreadyExists', locale),
      );
    }

    let logoUrl = dto.logoUrl || null;
    if (file?.filename) {
      logoUrl = `/uploads/institutes/${file.filename}`;
    }

    const institute = await this.prisma.institute.create({
      data: {
        name: dto.name,
        subdomain: dto.subdomain,
        isActive: dto.isActive ?? true,
        ...(dto.enabledModules && dto.enabledModules.length > 0
          ? { enabledModules: dto.enabledModules }
          : {}),
        logoUrl,
        primaryColor: dto.primaryColor || null,
        address: dto.address || null,
        phones: dto.phones ? dto.phones.filter(Boolean) : [],
        bankCardNumber: dto.bankCardNumber || null,
        bankAccountName: dto.bankAccountName || null,
        bankShaba: dto.bankShaba || null,
      },
    });

    // Automatically create a default Central Branch for the new institute
    await this.prisma.branch.create({
      data: {
        instituteId: institute.id,
        name: locale === 'fa' ? 'شعبه مرکزی' : 'Central Branch',
        address: dto.address || null,
        phones: dto.phones ? dto.phones.filter(Boolean) : [],
        isActive: true,
      },
    });

    return {
      ...institute,
      classesCount: 0,
      usersCount: 0,
    };
  }

  async update(
    id: string,
    dto: UpdateInstituteDto,
    file: Express.Multer.File | undefined,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.instituteId !== id) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const institute = await this.prisma.institute.findFirstOrThrow({
      where: { id, deletedAt: null },
    });

    if (institute.subdomain === 'system' && dto.isActive === false) {
      throw new ConflictException(
        this.i18n.t('institutes.cannotDeleteSystemInstitute', locale),
      );
    }

    if (dto.subdomain && dto.subdomain !== institute.subdomain) {
      const existing = await this.prisma.institute.findUnique({
        where: { subdomain: dto.subdomain },
      });

      if (existing) {
        throw new ConflictException(
          this.i18n.t('institutes.subdomainAlreadyExists', locale),
        );
      }
    }

    let logoUrl = dto.logoUrl;
    if (file?.filename) {
      logoUrl = `/uploads/institutes/${file.filename}`;
    }

    const { _count, ...updated } = await this.prisma.institute.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.subdomain ? { subdomain: dto.subdomain } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.enabledModules !== undefined
          ? { enabledModules: dto.enabledModules }
          : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...(dto.primaryColor !== undefined
          ? { primaryColor: dto.primaryColor }
          : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.phones !== undefined
          ? { phones: dto.phones.filter(Boolean) }
          : {}),
        ...(dto.bankCardNumber !== undefined
          ? { bankCardNumber: dto.bankCardNumber }
          : {}),
        ...(dto.bankAccountName !== undefined
          ? { bankAccountName: dto.bankAccountName }
          : {}),
        ...(dto.bankShaba !== undefined ? { bankShaba: dto.bankShaba } : {}),
        ...(dto.observeOfficialHolidays !== undefined
          ? { observeOfficialHolidays: dto.observeOfficialHolidays }
          : {}),
        ...(dto.dismissedHolidays !== undefined
          ? { dismissedHolidays: dto.dismissedHolidays }
          : {}),
      },
      include: {
        _count: {
          select: { classes: true, users: true },
        },
      },
    });

    if (dto.address !== undefined || dto.phones !== undefined) {
      await this.prisma.branch.updateMany({
        where: {
          instituteId: id,
          name: { in: ['شعبه مرکزی', 'Central Branch'] },
        },
        data: {
          ...(dto.address !== undefined
            ? { address: dto.address || null }
            : {}),
          ...(dto.phones !== undefined
            ? { phones: dto.phones.filter(Boolean) }
            : {}),
        },
      });
    }

    return {
      ...updated,
      classesCount: _count.classes,
      usersCount: _count.users,
    };
  }

  async delete(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const institute = await this.prisma.institute.findFirstOrThrow({
      where: { id, deletedAt: null },
    });

    if (institute.subdomain === 'system') {
      throw new ConflictException(
        this.i18n.t('institutes.cannotDeleteSystemInstitute', locale),
      );
    }

    await this.prisma.institute.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return {
      success: true,
      message: this.i18n.t('institutes.instituteDeletedSuccess', locale),
    };
  }

  async findCustomOffDays(
    instituteId: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.instituteId !== instituteId
    ) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    return this.prisma.instituteCustomOffDay.findMany({
      where: { instituteId },
      orderBy: { date: 'asc' },
    });
  }

  async createCustomOffDay(
    instituteId: string,
    dto: CreateInstituteCustomOffDayDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.instituteId !== instituteId
    ) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    const start = dto.startDate || dto.date;
    if (!start) {
      throw new BadRequestException(
        locale === 'fa' ? 'تاریخ نامعتبر است' : 'Invalid date',
      );
    }
    const end = dto.endDate || start;

    if (end < start) {
      throw new BadRequestException(
        locale === 'fa'
          ? 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد'
          : 'End date cannot be before start date',
      );
    }

    // Generate array of ISO dates between start and end inclusive
    const dates: string[] = [];
    const curr = new Date(start + 'T12:00:00Z');
    const last = new Date(end + 'T12:00:00Z');

    const diffDays = Math.round(
      (last.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 366) {
      throw new BadRequestException(
        locale === 'fa'
          ? 'بازه زمانی نمی‌تواند بیشتر از یک سال باشد'
          : 'Date range cannot exceed 1 year',
      );
    }

    while (curr <= last) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    // For single date, maintain existing ConflictException behavior if it already exists
    if (dates.length === 1) {
      const existing = await this.prisma.instituteCustomOffDay.findUnique({
        where: {
          instituteId_date: {
            instituteId,
            date: dates[0],
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          locale === 'fa'
            ? 'این تاریخ قبلاً به عنوان تعطیلی ثبت شده است'
            : 'This date has already been registered as an off-day',
        );
      }

      return this.prisma.instituteCustomOffDay.create({
        data: {
          instituteId,
          date: dates[0],
          title: dto.title,
        },
      });
    }

    // For date range (dates.length > 1), atomically upsert all dates in the range
    const records = await this.prisma.$transaction(
      dates.map((date) =>
        this.prisma.instituteCustomOffDay.upsert({
          where: {
            instituteId_date: {
              instituteId,
              date,
            },
          },
          create: {
            instituteId,
            date,
            title: dto.title,
          },
          update: {
            title: dto.title,
          },
        }),
      ),
    );

    return records;
  }

  async deleteCustomOffDay(
    instituteId: string,
    offDayId: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (
      currentUser.role !== 'SUPER_ADMIN' &&
      currentUser.instituteId !== instituteId
    ) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    await this.prisma.instituteCustomOffDay.findFirstOrThrow({
      where: { id: offDayId, instituteId },
    });

    return this.prisma.instituteCustomOffDay.delete({
      where: { id: offDayId },
    });
  }
}
