import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    payload?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        performedBy: input.performedBy,
        performedAt: new Date(),
        payload: this.normalizePayload(input.payload),
      },
    });
  }

  private normalizePayload(payload: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (payload === undefined) {
      return undefined;
    }

    if (payload === null) {
      return Prisma.JsonNull;
    }

    return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue;
  }
}