import { SetMetadata } from '@nestjs/common';

export const INVENTORY_COUNT_ALLOWED_ROLES_KEY = 'inventoryCountAllowedRoles';

export const InventoryCountAllowedRoles = (...roles: string[]) =>
  SetMetadata(INVENTORY_COUNT_ALLOWED_ROLES_KEY, roles);