const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  'node_modules',
  'dist',
  'coverage',
  '.tmp-postgres-idx011',
  '.tmp-postgres-inventory-smoke',
]);

const scannedExtensions = new Set(['.md', '.js', '.ts', '.json']);
const ignoredFiles = new Set([
  'tools/check-maintainer-path-references.js',
  'doc/architecture/data/maintainer_data_surface_governance.md',
]);

const forbiddenReferences = [
  {
    oldPath: 'project_maintainers/chat/sample/',
    newPath: 'apps/api/test/fixtures/intake-source-documents/',
  },
  {
    oldPath: 'project_maintainers/chat/1-2026-03-24_銷售商品組成對照表_template.csv',
    newPath: 'project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-24_銷售商品組成對照表_template_README.md',
    newPath: 'project_maintainers/data/notes/2026-03-24_銷售商品組成對照表_template_README.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-25_內包裝完成品主檔_template.csv',
    newPath: 'project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-25_六張CSV最終版欄位對照摘要.md',
    newPath: 'project_maintainers/data/notes/2026-03-25_六張CSV最終版欄位對照摘要.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-25_單位換算規則表_template.csv',
    newPath: 'project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-25_四張主資料工作表說明.md',
    newPath: 'project_maintainers/data/notes/2026-03-25_四張主資料工作表說明.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-25_外包裝材料主檔_template.csv',
    newPath: 'project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv',
    newPath: 'project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-26_銷售商品主檔_template.csv',
    newPath: 'project_maintainers/data/active/master-data/2026-03-26_銷售商品主檔_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-31_內包裝耗材用量對照表_template.csv',
    newPath: 'project_maintainers/data/active/rules/2026-03-31_內包裝耗材用量對照表_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-03-31_出貨及行政耗材總表_template.csv',
    newPath: 'project_maintainers/data/active/supplies/2026-03-31_出貨及行政耗材總表_template.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_半成品主檔第一版草案.csv',
    newPath: 'project_maintainers/data/drafts/semifinished/2026-04-01_半成品主檔第一版草案.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_半成品與自製混合料_owner草案說明.md',
    newPath: 'project_maintainers/data/drafts/semifinished/2026-04-01_半成品與自製混合料_owner草案說明.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_半成品配方明細草案.csv',
    newPath: 'project_maintainers/data/drafts/semifinished/2026-04-01_半成品配方明細草案.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_半成品配方版本草案.csv',
    newPath: 'project_maintainers/data/drafts/semifinished/2026-04-01_半成品配方版本草案.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_原料主檔最低版本欄位模板.csv',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料主檔最低版本欄位模板.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_原料主檔最低版本草案.csv',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料主檔最低版本草案.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_原料單位換算表草案.csv',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料單位換算表草案.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_原料正式代碼規則草案.md',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料正式代碼規則草案.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_原料正式化說明.md',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料正式化說明.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_食材待補資訊總清單.md',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_食材待補資訊總清單.md',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_食材清單_分類mapping草案.csv',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_食材清單_分類mapping草案.csv',
  },
  {
    oldPath: 'project_maintainers/chat/2026-04-01_食材清單轉換分析.md',
    newPath: 'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_食材清單轉換分析.md',
  },
  {
    oldPath: 'project_maintainers/chat/20260325-生產統計表.xlsm',
    newPath: 'project_maintainers/data/raw-workbooks/20260325-生產統計表.xlsm',
  },
  {
    oldPath: 'project_maintainers/chat/內包裝耗材.xlsx',
    newPath: 'project_maintainers/data/raw-workbooks/內包裝耗材.xlsx',
  },
  {
    oldPath: 'project_maintainers/chat/出貨部耗材.xlsx',
    newPath: 'project_maintainers/data/raw-workbooks/出貨部耗材.xlsx',
  },
  {
    oldPath: 'project_maintainers/chat/成品商品清單.xlsx',
    newPath: 'project_maintainers/data/raw-workbooks/成品商品清單.xlsx',
  },
  {
    oldPath: 'project_maintainers/chat/食材清單.xlsx',
    newPath: 'project_maintainers/data/raw-workbooks/食材清單.xlsx',
  },
];

const findings = [];

walk(repoRoot);

if (findings.length > 0) {
  console.error('Forbidden maintainer path references found:');
  for (const finding of findings) {
    console.error(`- ${finding.filePath}`);
    console.error(`  old: ${finding.oldPath}`);
    console.error(`  new: ${finding.newPath}`);
  }
  process.exit(1);
}

console.log('Maintainer path guard passed.');

function walk(currentPath) {
  const entries = fs.readdirSync(currentPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) {
        continue;
      }

      walk(path.join(currentPath, entry.name));
      continue;
    }

    const extension = path.extname(entry.name);
    if (!scannedExtensions.has(extension)) {
      continue;
    }

    const absolutePath = path.join(currentPath, entry.name);
    const relativePath = path.relative(repoRoot, absolutePath).replace(/\\/gu, '/');

    if (ignoredFiles.has(relativePath)) {
      continue;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');

    for (const forbiddenReference of forbiddenReferences) {
      if (content.includes(forbiddenReference.oldPath)) {
        findings.push({
          filePath: relativePath,
          oldPath: forbiddenReference.oldPath,
          newPath: forbiddenReference.newPath,
        });
      }
    }
  }
}