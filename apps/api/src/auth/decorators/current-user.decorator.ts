import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@workspace/types';

import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: JwtPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
