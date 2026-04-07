import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

import {
  PortalSessionPrincipal,
  RequestWithPortalSessionPrincipal,
} from './portal-session-principal';

export const CurrentPortalPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PortalSessionPrincipal => {
    const request = context.switchToHttp().getRequest<RequestWithPortalSessionPrincipal>();
    const principal = request.portalPrincipal;

    if (!principal) {
      throw new ForbiddenException('缺少 Portal session principal context');
    }

    return principal;
  },
);