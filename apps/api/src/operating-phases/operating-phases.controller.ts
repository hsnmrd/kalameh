import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OperatingPhasesService } from './operating-phases.service';
import { CreateOperatingPhaseDto } from './dto/create-operating-phase.dto';
import { UpdateOperatingPhaseDto } from './dto/update-operating-phase.dto';
import { PreviewSlotsDto } from './dto/preview-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  PERMISSIONS,
  type JwtPayload,
  type OperatingPhaseWithSlots,
  type PhaseSlotsCalculationResult,
} from '@workspace/types';

@Controller('operating-phases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OperatingPhasesController {
  constructor(private readonly service: OperatingPhasesService) {}

  @Get('preview')
  @RequirePermissions(PERMISSIONS.VIEW_OPERATING_PHASES)
  preview(@Query() dto: PreviewSlotsDto): PhaseSlotsCalculationResult {
    return this.service.preview(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_OPERATING_PHASES)
  async findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query('instituteId') targetInstituteId?: string,
  ): Promise<OperatingPhaseWithSlots[]> {
    return this.service.findAll(currentUser, targetInstituteId);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_OPERATING_PHASES)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<OperatingPhaseWithSlots> {
    return this.service.findOne(id, currentUser);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_OPERATING_PHASES)
  async create(
    @Body() dto: CreateOperatingPhaseDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<OperatingPhaseWithSlots> {
    return this.service.create(dto, currentUser);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_OPERATING_PHASES)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOperatingPhaseDto,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<OperatingPhaseWithSlots> {
    return this.service.update(id, dto, currentUser);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.MANAGE_OPERATING_PHASES)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<{ success: boolean }> {
    return this.service.remove(id, currentUser);
  }
}
