import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import { PrismaClient } from '@prisma/client';

import { getMaintainerDataRelativePath } from '../src/master-data/maintainer-data-paths';

const prisma = new PrismaClient();

const sourceFiles = [
  '2026-03-26_銷售商品主檔_template.csv',
  '2026-03-25_內包裝完成品主檔_template.csv',
  '2026-03-25_外包裝材料主檔_template.csv',
  '1-2026-03-24_銷售商品組成對照表_template.csv',
  '2026-03-31_內包裝耗材用量對照表_template.csv',
  '2026-03-25_生產_分裝_轉換扣帳規則表_template.csv',
  '2026-03-31_出貨及行政耗材總表_template.csv',
];

async function main() {
  const payload = sourceFiles.map((fileName) => {
    const absolutePath = path.resolve(__dirname, '../../..', getMaintainerDataRelativePath(fileName));
    const content = fs.readFileSync(absolutePath, 'utf8');

    return {
      fileName,
      sha256: createHash('sha256').update(content).digest('hex'),
      byteLength: Buffer.byteLength(content),
    };
  });

  await prisma.auditLog.create({
    data: {
      action: 'system.bootstrap.seeded',
      entityType: 'SystemBootstrap',
      entityId: 'daily-ops-mvp-bootstrap-v1',
      performedBy: 'system-seed',
      performedAt: new Date(),
      payload: {
        strategy: 'CSV remains owner for master-data and recipe references under project_maintainers/data; opening balances must be loaded via first inventory count session, not synthetic seed rows.',
        sourceFiles: payload,
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });