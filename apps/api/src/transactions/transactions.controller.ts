import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { ModulesGuard } from '../auth/guards/modules.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { RequireModules } from '../auth/decorators/modules.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLocale } from '../i18n';
import { I18nService } from '../i18n/i18n.service';
import { imageUploadOptions } from '../common/upload/multer.util';
import {
  APP_MODULES,
  PERMISSIONS,
  type JwtPayload,
  type SupportedLocale,
} from '@workspace/types';

@Controller('transactions')
@UseGuards(JwtAuthGuard, PermissionsGuard, ModulesGuard)
@RequireModules(APP_MODULES.FINANCE)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  @RequirePermissions(PERMISSIONS.VIEW_TRANSACTIONS)
  findAll(
    @CurrentUser() currentUser: JwtPayload,
    @Query() filter: TransactionFilterDto,
  ) {
    return this.transactionsService.findAll(currentUser, filter);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.VIEW_TRANSACTIONS)
  findOne(@Param('id') id: string, @CurrentUser() currentUser: JwtPayload) {
    return this.transactionsService.findOne(id, currentUser);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.SUBMIT_RECEIPT)
  @UseInterceptors(
    FileInterceptor('receipt', imageUploadOptions('transactions')),
  )
  create(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CreateTransactionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentLocale() locale: SupportedLocale,
  ) {
    if (!file?.filename) {
      throw new BadRequestException(
        this.i18n.t('transactions.receiptRequired', locale),
      );
    }

    return this.transactionsService.create(
      currentUser,
      dto,
      `/uploads/transactions/${file.filename}`,
      locale,
    );
  }

  @Patch(':id/status')
  @RequirePermissions(PERMISSIONS.MANAGE_TRANSACTIONS)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionStatusDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return this.transactionsService.updateStatus(id, dto, currentUser);
  }
}
