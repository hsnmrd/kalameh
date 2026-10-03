import { SetMetadata } from '@nestjs/common';
import type { AppModule } from '@workspace/types';

export const MODULES_KEY = 'required_modules';

export const RequireModules = (...modules: AppModule[]) =>
  SetMetadata(MODULES_KEY, modules);
