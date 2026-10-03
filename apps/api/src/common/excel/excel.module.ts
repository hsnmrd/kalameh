import { Module, Global } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { I18nModule } from '../../i18n/i18n.module';

@Global()
@Module({
  imports: [I18nModule],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
