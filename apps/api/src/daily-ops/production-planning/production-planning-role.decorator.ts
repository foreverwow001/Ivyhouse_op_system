import { SetMetadata } from '@nestjs/common';

export const PRODUCTION_PLANNING_ALLOWED_ROLES_KEY = 'productionPlanningAllowedRoles';

export const ProductionPlanningAllowedRoles = (...roles: string[]) =>
  SetMetadata(PRODUCTION_PLANNING_ALLOWED_ROLES_KEY, roles);