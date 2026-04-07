const assert = require('node:assert/strict');
const test = require('node:test');

const { getMaintainerDataRelativePath } = require('../dist/master-data/maintainer-data-paths.js');

test('半成品與原料 owner surface 已切到 active master-data 路徑', () => {
  assert.match(
    getMaintainerDataRelativePath('2026-04-01_半成品主檔第一版草案.csv'),
    /^project_maintainers\/data\/active\/master-data\//u,
  );

  assert.match(
    getMaintainerDataRelativePath('2026-04-01_原料主檔最低版本草案.csv'),
    /^project_maintainers\/data\/active\/master-data\//u,
  );
});
