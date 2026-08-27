import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { I18nService } from '../i18n/i18n.service';
import { CreateTermDto } from './dto/create-term.dto';
import { UpdateTermDto } from './dto/update-term.dto';
import type { JwtPayload, SupportedLocale, TermDto } from '@workspace/types';

@Injectable()
export class TermsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(
    currentUser: JwtPayload,
    targetInstituteId?: string,
    search?: string,
    isActive?: boolean,
  ): Promise<TermDto[]> {
    const instituteId =
      currentUser.role === 'SUPER_ADMIN' && targetInstituteId
        ? targetInstituteId
        : currentUser.instituteId;

    const terms = await this.prisma.term.findMany({
      where: {
        instituteId,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        _count: { select: { classes: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return terms.map(({ _count, ...term }) => ({
      ...term,
      classesCount: _count.classes,
    }));
  }

  async findOne(
    id: string,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto> {
    const instituteId = currentUser.instituteId;

    const term = await this.prisma.term.findFirst({
      where: {
        id,
        ...(currentUser.role === 'SUPER_ADMIN' ? {} : { instituteId }),
      },
      include: {
        _count: { select: { classes: true } },
      },
    });

    if (!term) {
      throw new NotFoundException(this.i18n.t('terms.termNotFound', locale));
    }

    const { _count, ...data } = term;
    return {
      ...data,
      classesCount: _count.classes,
    };
  }

  async create(
    dto: CreateTermDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto> {
    const instituteId = currentUser.instituteId;

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException(
        this.i18n.t('terms.invalidDateRange', locale),
      );
    }

    // Check duplicate title in same institute
    const existing = await this.prisma.term.findFirst({
      where: {
        instituteId,
        title: dto.title,
      },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('terms.termAlreadyExists', locale),
      );
    }

    const created = await this.prisma.term.create({
      data: {
        instituteId,
        title: dto.title,
        startDate: start,
        endDate: end,
        isActive: dto.isActive ?? true,
      },
      include: {
        _count: { select: { classes: true } },
      },
    });

    const { _count, ...data } = created;
    return {
      ...data,
      classesCount: _count.classes,
    };
  }

  async update(
    id: string,
    dto: UpdateTermDto,
    currentUser: JwtPayload,
    locale: SupportedLocale = 'fa',
  ): Promise<TermDto> {
    const existing = await this.findOne(id, currentUser, locale);

    const start = dto.startDate
      ? new Date(dto.startDate)
      : new Date(existing.startDate);
    const end = dto.endDate
      ? new Date(dto.endDate)
      : new Date(existing.endDate);
    if (start >= end) {
      throw new BadRequestException(
        this.i18n.t('terms.invalidDateRange', locale),
      );
    }

    if (dto.title && dto.title !== existing.title) {
      const duplicate = await this.prisma.term.findFirst({
        where: {
          instituteId: existing.instituteId,
          title: dto.title,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          this.i18n.t('terms.termAlreadyExists', locale),
        );
      }
    }

    const updated = await this.prisma.term.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.startDate ? { startDate: start } : {}),
        ...(dto.endDate ? { endDate: end } : {}),
        ...(typeof dto.isActive === 'boolean'
          ? { isActive: dto.isActive }
          : {}),
      },
      include: {
        _count: { select: { classes: true } },
      },
    });

    const { _count, ...data } = updated;
    return {
      ...data,
      classesCount: _count.classes,
    };
  }
}
