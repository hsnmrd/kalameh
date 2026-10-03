import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { SupportedLocale } from '@workspace/types';

export const CurrentLocale = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupportedLocale => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const acceptLanguage =
      request.headers['accept-language'] ||
      (request.headers['x-lang'] as string) ||
      (request.headers['x-locale'] as string) ||
      '';

    const normalized = acceptLanguage.toLowerCase().trim();

    if (normalized.startsWith('en')) {
      return 'en';
    }

    return 'fa';
  },
);
