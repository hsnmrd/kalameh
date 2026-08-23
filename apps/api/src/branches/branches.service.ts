import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import type {
  JwtPayload,
  SupportedLocale,
  BranchWithStats,
} from '@workspace/types';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
  ): Promise<BranchWithStats[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && targetInstituteId
        ? targetInstituteId
        : currentUser.instituteId;

    const branches = await this.prisma.branch.findMany({
      where: { instituteId },
      include: {
        _count: { select: { classes: true, users: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return branches.map(({ _count, ...branch }) => ({
      ...branch,
      classesCount: _count.classes,
      usersCount: _count.users,
    }));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<BranchWithStats> {
    const instituteId = currentUser.instituteId;

    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        _count: { select: { classes: true, users: true } },
      },
    });

    if (!branch) {
      throw new NotFoundException(
        this.i18n.t('branches.branchNotFound', locale),
      );
    }

    const { _count, ...data } = branch;
    return {
      ...data,
      classesCount: _count.classes,
      usersCount: _count.users,
    };
  }

  async create(
    dto: CreateBranchDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<BranchWithStats> {
    const instituteId = currentUser.instituteId;

    const existing = await this.prisma.branch.findFirst({
      where: {
        instituteId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('branches.branchAlreadyExists', locale),
      );
    }

    const created = await this.prisma.branch.create({
      data: {
        instituteId,
        name: dto.name,
        address: dto.address || null,
        phones: dto.phones ? dto.phones.filter(Boolean) : [],
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: { select: { classes: true, users: true } },
      },
    });

    const { _count, ...data } = created;
    return {
      ...data,
      classesCount: _count.classes,
      usersCount: _count.users,
    };
  }

  async update(
    id: string,
    dto: UpdateBranchDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<BranchWithStats> {
    const existing = await this.findOne(id, currentUser, locale);

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.branch.findFirst({
        where: {
          instituteId: existing.instituteId,
          name: dto.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('branches.branchAlreadyExists', locale),
        );
      }
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.address !== undefined ? { address: dto.address || null } : {}),
        ...(dto.phones !== undefined
          ? { phones: dto.phones.filter(Boolean) }
          : {}),
        ...(typeof dto.isActive === 'boolean'
          ? { isActive: dto.isActive }
          : {}),
      },
      include: {
        _count: { select: { classes: true, users: true } },
      },
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      classesCount: _count.classes,
      usersCount: _count.users,
    };
  }
}
