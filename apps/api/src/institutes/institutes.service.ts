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
import {
  calculateTermLifecycleStatuses,
  JwtPayload,
  SupportedLocale,
} from '@workspace/types';
import { createDefaultOperatingPhases } from './default-operating-phases';
import { resolveUploadedFileUrl } from '../common/upload/multer.util';

@Injectable()
export class InstitutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(currentUser: JwtPayload, search?: string, isActive?: boolean) {
    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(this.i18n.t('common.forbidden', 'fa'));
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

  async hasActiveRegistrationTerm(instituteId: string): Promise<boolean> {
    if (!this.prisma.term?.findMany) {
      return false;
    }

    const institute = this.prisma.institute?.findUnique
      ? await this.prisma.institute.findUnique({
          where: { id: instituteId },
          select: {
            termRegistrationDaysBeforeStart: true,
            termRegistrationDaysAfterStart: true,
            termExamDaysBeforeEnd: true,
          },
        })
      : null;

    const activeTerms = await this.prisma.term.findMany({
      where: {
        instituteId,
        isActive: true,
      },
      orderBy: { startDate: 'desc' },
    });

    if (activeTerms.length === 0) {
      return false;
    }

    const settings = institute
      ? {
          registrationDaysBeforeStart:
            institute.termRegistrationDaysBeforeStart,
          registrationDaysAfterStart: institute.termRegistrationDaysAfterStart,
          examDaysBeforeEnd: institute.termExamDaysBeforeEnd,
        }
      : undefined;

    const now = new Date();
    for (const term of activeTerms) {
      const statuses = calculateTermLifecycleStatuses(
        term,
        activeTerms,
        settings,
        now,
      );
      if (statuses.includes('REGISTERING')) {
        return true;
      }
    }

    return false;
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

    const hasActiveRegistration = await this.hasActiveRegistrationTerm(id);

    return {
      ...institute,
      classesCount: _count.classes,
      usersCount: _count.users,
      coursesCount: _count.courses,
      termsCount: _count.terms,
      hasActiveRegistrationTerm: hasActiveRegistration,
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
      logoUrl = resolveUploadedFileUrl(file, 'institutes');
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

    // Automatically create default operating phases (Academic Year & Summer)
    await createDefaultOperatingPhases(this.prisma, institute.id, locale);

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

    const sanitizeBankField = (val: string | null | undefined) => {
      if (val === undefined) return undefined;
      if (!val || val === 'null' || val === 'undefined' || val.trim() === '') {
        return null;
      }
      return val.trim();
    };

    const isChangingBankInfo =
      (dto.bankAccountName !== undefined &&
        sanitizeBankField(dto.bankAccountName) !==
          sanitizeBankField(institute.bankAccountName)) ||
      (dto.bankCardNumber !== undefined &&
        sanitizeBankField(dto.bankCardNumber) !==
          sanitizeBankField(institute.bankCardNumber)) ||
      (dto.bankShaba !== undefined &&
        sanitizeBankField(dto.bankShaba) !==
          sanitizeBankField(institute.bankShaba));

    if (isChangingBankInfo) {
      const hasActiveRegistration = await this.hasActiveRegistrationTerm(id);
      if (hasActiveRegistration) {
        throw new ConflictException(
          this.i18n.t(
            'institutes.cannotModifyBankInfoDuringRegistration',
            locale,
          ),
        );
      }
    }

    let formattedShaba =
      dto.bankShaba !== undefined
        ? sanitizeBankField(dto.bankShaba)
        : undefined;
    if (formattedShaba) {
      const cleaned = formattedShaba.replace(/\s+/g, '').toUpperCase();
      formattedShaba = cleaned.startsWith('IR') ? cleaned : `IR${cleaned}`;
    }

    let logoUrl = dto.logoUrl;
    if (file?.filename) {
      logoUrl = resolveUploadedFileUrl(file, 'institutes');
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
          ? { bankCardNumber: sanitizeBankField(dto.bankCardNumber) }
          : {}),
        ...(dto.bankAccountName !== undefined
          ? { bankAccountName: sanitizeBankField(dto.bankAccountName) }
          : {}),
        ...(dto.bankShaba !== undefined ? { bankShaba: formattedShaba } : {}),
        ...(dto.observeOfficialHolidays !== undefined
          ? { observeOfficialHolidays: dto.observeOfficialHolidays }
          : {}),
        ...(dto.dismissedHolidays !== undefined
          ? { dismissedHolidays: dto.dismissedHolidays }
          : {}),
        ...(dto.termRegistrationDaysBeforeStart !== undefined
          ? {
              termRegistrationDaysBeforeStart:
                dto.termRegistrationDaysBeforeStart,
            }
          : {}),
        ...(dto.termRegistrationDaysAfterStart !== undefined
          ? {
              termRegistrationDaysAfterStart:
                dto.termRegistrationDaysAfterStart,
            }
          : {}),
        ...(dto.termExamDaysBeforeEnd !== undefined
          ? { termExamDaysBeforeEnd: dto.termExamDaysBeforeEnd }
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

    const hasActiveRegistration = await this.hasActiveRegistrationTerm(id);

    return {
      ...updated,
      classesCount: _count.classes,
      usersCount: _count.users,
      hasActiveRegistrationTerm: hasActiveRegistration,
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

    return await this.prisma.instituteCustomOffDay.findMany({
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

  async deleteBankInfo(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.instituteId !== id) {
      throw new ForbiddenException(this.i18n.t('common.forbidden', locale));
    }

    await this.prisma.institute.findFirstOrThrow({
      where: { id, deletedAt: null },
    });

    const hasActiveRegistration = await this.hasActiveRegistrationTerm(id);
    if (hasActiveRegistration) {
      throw new ConflictException(
        this.i18n.t(
          'institutes.cannotModifyBankInfoDuringRegistration',
          locale,
        ),
      );
    }

    const { _count, ...updated } = await this.prisma.institute.update({
      where: { id },
      data: {
        bankAccountName: null,
        bankCardNumber: null,
        bankShaba: null,
      },
      include: {
        _count: {
          select: { classes: true, users: true },
        },
      },
    });

    return {
      ...updated,
      classesCount: _count.classes,
      usersCount: _count.users,
      hasActiveRegistrationTerm: false,
    };
  }

  async updateBankInfo(
    id: string,
    dto: UpdateInstituteDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ) {
    return this.update(id, dto, undefined, currentUser, locale);
  }

  async getBankInfo(instituteId: string) {
    const info = await this.prisma.institute.findFirstOrThrow({
      where: { id: instituteId },
      select: {
        bankCardNumber: true,
        bankAccountName: true,
        bankShaba: true,
      },
    });

    const sanitize = (val: string | null) =>
      val && val !== 'null' && val !== 'undefined' ? val : null;

    return {
      bankCardNumber: sanitize(info.bankCardNumber),
      bankAccountName: sanitize(info.bankAccountName),
      bankShaba: sanitize(info.bankShaba),
    };
  }
}
