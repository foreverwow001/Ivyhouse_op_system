import { BadRequestException, Injectable } from '@nestjs/common';
import { InventoryItemType } from '@prisma/client';
import fs from 'fs';
import { read, readFile, utils } from 'xlsx';
import path from 'path';

import { getMaintainerDataRelativePath } from './maintainer-data-paths';

type InventoryReference = {
  bucketType: string;
  itemSku: string;
};

type InventoryItemMetadata = {
  itemSku: string;
  itemName: string;
  inventoryPrimaryUnit: string;
};

@Injectable()
export class MasterDataService {
  private cache:
    | {
        sellable: Set<string>;
        innerPack: Set<string>;
        semiFinished: Set<string>;
        rawMaterial: Set<string>;
        material: Set<string>;
        shippingSupplyManual: Set<string>;
        sellableMetadata: Map<string, InventoryItemMetadata>;
        innerPackMetadata: Map<string, InventoryItemMetadata>;
        semiFinishedMetadata: Map<string, InventoryItemMetadata>;
        rawMaterialMetadata: Map<string, InventoryItemMetadata>;
        materialMetadata: Map<string, InventoryItemMetadata>;
        shippingSupplyMetadata: Map<string, InventoryItemMetadata>;
      }
    | undefined;

  async assertSellableSkusExist(skus: string[]) {
    const missing = skus.filter((sku) => !this.getCache().sellable.has(sku));
    if (missing.length > 0) {
      throw new BadRequestException(`找不到正式銷售商品 SKU: ${missing.join(', ')}`);
    }
  }

  async assertProductionTargetsExist(
    lines: Array<{
      planLevel: string;
      targetSku: string;
    }>,
  ) {
    const cache = this.getCache();
    const missing = lines.filter((line) => {
      if (line.planLevel === 'SELLABLE') {
        return !cache.sellable.has(line.targetSku);
      }

      return !cache.innerPack.has(line.targetSku);
    });

    if (missing.length > 0) {
      throw new BadRequestException(
        `找不到排工目標主資料: ${missing.map((line) => line.targetSku).join(', ')}`,
      );
    }
  }

  async assertInventoryItemsExist(items: InventoryReference[]) {
    const cache = this.getCache();
    const missing = items.filter((item) => {
      if (item.bucketType === 'SELLABLE') {
        return !cache.sellable.has(item.itemSku);
      }

      if (item.bucketType === 'INNER_PACK_FINISHED') {
        return !cache.innerPack.has(item.itemSku) && !cache.semiFinished.has(item.itemSku);
      }

      if (item.bucketType === 'PACKAGING_MATERIAL') {
        return !cache.material.has(item.itemSku);
      }

      if (item.bucketType === 'SHIPPING_SUPPLY_MANUAL') {
        return !cache.shippingSupplyManual.has(item.itemSku);
      }

      return true;
    });

    if (missing.length > 0) {
      throw new BadRequestException(
        `找不到 inventory item 主資料: ${missing.map((item) => `${item.bucketType}:${item.itemSku}`).join(', ')}`,
      );
    }
  }

  getInventoryItemMetadata(bucketType: string, itemSku: string) {
    const cache = this.getCache();

    if (bucketType === 'SELLABLE') {
      return cache.sellableMetadata.get(itemSku) ?? null;
    }

    if (bucketType === 'INNER_PACK_FINISHED') {
      return cache.innerPackMetadata.get(itemSku) ?? cache.semiFinishedMetadata.get(itemSku) ?? null;
    }

    if (bucketType === 'PACKAGING_MATERIAL') {
      return cache.materialMetadata.get(itemSku) ?? null;
    }

    if (bucketType === 'SHIPPING_SUPPLY_MANUAL') {
      return cache.shippingSupplyMetadata.get(itemSku) ?? null;
    }

    return null;
  }

  getInventoryItemMetadataMap(items: InventoryReference[]) {
    return new Map(
      items.map((item) => [
        `${item.bucketType}:${item.itemSku}`,
        this.getInventoryItemMetadata(item.bucketType, item.itemSku),
      ]),
    );
  }

  resolveCompositionInputType(itemSku: string) {
    const cache = this.getCache();

    if (cache.innerPack.has(itemSku) || cache.semiFinished.has(itemSku)) {
      return InventoryItemType.INNER_PACK_PRODUCT;
    }

    if (cache.rawMaterial.has(itemSku)) {
      return InventoryItemType.MATERIAL;
    }

    throw new BadRequestException(`組成輸入未對應正式內包裝或原料主檔: ${itemSku}`);
  }

  private getCache() {
    if (!this.cache) {
      this.cache = {
        sellable: this.loadActiveSkuSet('2026-03-26_銷售商品主檔_template.csv', '銷售商品SKU_正式'),
        innerPack: this.loadActiveSkuSet('2026-03-25_內包裝完成品主檔_template.csv', '內包裝完成品SKU_正式'),
        semiFinished: this.loadActiveSkuSet(
          '2026-04-01_半成品主檔第一版草案.csv',
          '半成品SKU_草案',
          ['草稿', '啟用'],
        ),
        rawMaterial: this.loadActiveSkuSet(
          '2026-04-01_原料主檔最低版本草案.csv',
          '原料代碼',
          ['草稿', '啟用'],
        ),
        material: this.loadActiveSkuSet('2026-03-25_外包裝材料主檔_template.csv', '外包裝材料SKU_正式'),
        shippingSupplyManual: this.loadShippingSupplyManualSet(),
        sellableMetadata: this.loadMetadataMap(
          '2026-03-26_銷售商品主檔_template.csv',
          '銷售商品SKU_正式',
          '銷售商品名稱',
          '主要銷售單位',
        ),
        innerPackMetadata: this.loadMetadataMap(
          '2026-03-25_內包裝完成品主檔_template.csv',
          '內包裝完成品SKU_正式',
          '內包裝完成品名稱_正式',
          '庫存主單位',
        ),
        semiFinishedMetadata: this.loadMetadataMap(
          '2026-04-01_半成品主檔第一版草案.csv',
          '半成品SKU_草案',
          '半成品名稱',
          '庫存主單位',
        ),
        rawMaterialMetadata: this.loadMetadataMap(
          '2026-04-01_原料主檔最低版本草案.csv',
          '原料代碼',
          '原料名稱',
          '庫存主單位',
        ),
        materialMetadata: this.loadMetadataMap(
          '2026-03-25_外包裝材料主檔_template.csv',
          '外包裝材料SKU_正式',
          '外包裝材料名稱',
          '庫存單位',
        ),
        shippingSupplyMetadata: this.loadShippingSupplyMetadataMap(),
      };
    }

    return this.cache;
  }

  private loadActiveSkuSet(
    fileName: string,
    skuColumn: string,
    activeStatuses = ['啟用'],
  ) {
    const rows = this.readOwnerRows(fileName);

    return new Set(
      rows
        .filter((row) => activeStatuses.includes(String(row['狀態'] ?? '').trim()))
        .map((row) => String(row[skuColumn] ?? '').trim())
        .filter(Boolean),
    );
  }

  private loadMetadataMap(
    fileName: string,
    skuColumn: string,
    nameColumn: string,
    unitColumn: string,
  ) {
    const rows = this.readOwnerRows(fileName);

    return new Map(
      rows
        .map((row) => ({
          itemSku: String(row[skuColumn] ?? '').trim(),
          itemName: String(row[nameColumn] ?? '').trim(),
          inventoryPrimaryUnit: String(row[unitColumn] ?? '').trim(),
        }))
        .filter((row) => row.itemSku)
        .map((row) => [row.itemSku, row]),
    );
  }

  private loadShippingSupplyManualSet() {
    const rows = this.readOwnerRows('2026-03-31_出貨及行政耗材總表_template.csv');

    return new Set(
      rows
        .filter((row) => String(row['狀態'] ?? '').trim() === '啟用')
        .flatMap((row) => [String(row['項次'] ?? '').trim(), String(row['出貨及行政耗材名稱'] ?? '').trim()])
        .filter(Boolean),
    );
  }

  private loadShippingSupplyMetadataMap() {
    const rows = this.readOwnerRows('2026-03-31_出貨及行政耗材總表_template.csv');
    const metadata = new Map<string, InventoryItemMetadata>();

    for (const row of rows) {
      const itemSku = String(row['項次'] ?? '').trim();
      const itemName = String(row['出貨及行政耗材名稱'] ?? '').trim();
      const inventoryPrimaryUnit = String(row['庫存單位'] ?? '').trim();

      if (!itemSku && !itemName) {
        continue;
      }

      const item = {
        itemSku: itemSku || itemName,
        itemName,
        inventoryPrimaryUnit,
      };

      if (itemSku) {
        metadata.set(itemSku, item);
      }
      if (itemName) {
        metadata.set(itemName, item);
      }
    }

    return metadata;
  }

  readOwnerRows(fileName: string) {
    const filePath = this.resolveChatFile(fileName);
    const workbook = fileName.endsWith('.csv')
      ? read(fs.readFileSync(filePath, 'utf8'), { type: 'string', raw: false })
      : readFile(filePath, { raw: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    return rows.map((row) => this.normalizeRowKeys(row));
  }

  resolveChatFile(fileName: string) {
    return path.resolve(__dirname, '../../../..', getMaintainerDataRelativePath(fileName));
  }

  private normalizeRowKeys(row: Record<string, unknown>) {
    return Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.replace(/^\uFEFF/u, '').trim(), value]),
    );
  }
}