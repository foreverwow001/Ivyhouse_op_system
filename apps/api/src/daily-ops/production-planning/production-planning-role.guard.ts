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

import { PRODUCTION_PLANNING_ALLOWED_ROLES_KEY } from './production-planning-role.decorator';

const ROLE_ALIASES: Record<string, string> = {
  production: '生產',
  packaging: '包裝及出貨',
  'packaging-shipping': '包裝及出貨',
  finance: '會計',
  supervisor: '主管',
  admin: '管理員',
  administrator: '管理員',
};

const ROLE_NORMALIZATION: Record<string, string> = {
  包裝: '包裝及出貨',
  行政: '管理員',
  系統管理: '管理員',
};

@Injectable()
export class ProductionPlanningRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles =
      this.reflector.getAllAndOverride<string[]>(PRODUCTION_PLANNING_ALLOWED_ROLES_KEY, [
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
      roleNormalization: ROLE_NORMALIZATION,
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