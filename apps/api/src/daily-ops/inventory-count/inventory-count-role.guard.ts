import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  RequestWithPortalSessionPrincipal,
  resolvePortalSessionPrincipal,
} from '../../common/auth/portal-session-principal';

import { INVENTORY_COUNT_ALLOWED_ROLES_KEY } from './inventory-count-role.decorator';

const ROLE_ALIASES: Record<string, string> = {
  production: '生產',
  packaging: '包裝',
  finance: '會計',
  supervisor: '主管',
  admin: '行政',
};

@Injectable()
export class InventoryCountRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles =
      this.reflector.getAllAndOverride<string[]>(INVENTORY_COUNT_ALLOWED_ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (allowedRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithPortalSessionPrincipal & { headers: Record<string, string | string[] | undefined> }>();
    const principal = resolvePortalSessionPrincipal(request.headers, {
      roleAliases: ROLE_ALIASES,
    });

    if (!principal) {
      throw new ForbiddenException(
        '缺少 Portal session principal headers: x-portal-principal-id, x-portal-session-id, x-portal-role-codes',
      );
    }

    request.portalPrincipal = principal;

    const isAllowed = principal.roleCodes.some((role) => allowedRoles.includes(role));

    if (!isAllowed) {
      throw new ForbiddenException(`此操作需要角色: ${allowedRoles.join(', ')}`);
    }

    return true;
  }
}