const assert = require('node:assert/strict');
const test = require('node:test');

const { MasterDataService } = require('../dist/master-data/master-data.service.js');
const { RecipeOwnerService } = require('../dist/master-data/recipe-owner.service.js');

test('sellable 組成中的 inner-pack 與 raw direct-pack 會被正確分類', async () => {
  const masterDataService = new MasterDataService();
  const recipeOwnerService = new RecipeOwnerService(masterDataService);

  const lines = await recipeOwnerService.buildReservationLinesForPlanLines([
    {
      planLevel: 'SELLABLE',
      targetSku: 'A10010',
      targetName: '豆塔-蔓越莓',
      plannedQty: 2,
      uom: '袋',
    },
    {
      planLevel: 'SELLABLE',
      targetSku: 'N10120',
      targetName: '無調味夏威夷豆',
      plannedQty: 2,
      uom: '包',
    },
  ]);

  const innerPackLine = lines.find((line) => line.materialSku === 'A1');
  const rawMaterialLine = lines.find((line) => line.materialSku === 'RM0001');
  const packagingLine = lines.find((line) => line.materialSku === 'PK0016');

  assert.ok(innerPackLine, '應展開 A1 內包裝完成品');
  assert.equal(innerPackLine.materialType, 'INNER_PACK_PRODUCT');
  assert.equal(innerPackLine.qtyDelta, -20);

  assert.ok(rawMaterialLine, '應展開 RM0001 原料直分裝');
  assert.equal(rawMaterialLine.materialType, 'MATERIAL');
  assert.equal(rawMaterialLine.qtyDelta, -240);
  assert.equal(rawMaterialLine.uom, 'g');

  assert.ok(packagingLine, '應保留外包裝材料扣帳');
  assert.equal(packagingLine.materialType, 'MATERIAL');
});