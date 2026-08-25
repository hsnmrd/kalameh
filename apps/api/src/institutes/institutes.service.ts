import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateInstituteDto } from './dto/create-institute.dto';
import { UpdateInstituteDto } from './dto/update-institute.dto';
import { JwtPayload, SupportedLocale } from '@workspace/types';

@Injectable()
export class InstitutesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(currentUser: JwtPayload) {
    if (currentUser.role !== 'SUPER_ADMIN') {
      const { _count, ...institute } =
        await this.prisma.institute.findFirstOrThrow({
          where: { id: currentUser.instituteId, deletedAt: null },
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
      where: { subdomain: { not: 'system' }, deletedAt: null },
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
}
