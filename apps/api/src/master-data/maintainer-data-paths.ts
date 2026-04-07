const maintainerDataRelativePaths: Record<string, string> = {
  '1-2026-03-24_銷售商品組成對照表_template.csv':
    'project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv',
  '2026-03-25_內包裝完成品主檔_template.csv':
    'project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv',
  '2026-03-25_外包裝材料主檔_template.csv':
    'project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv',
  '2026-03-25_單位換算規則表_template.csv':
    'project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv',
  '2026-03-25_生產_分裝_轉換扣帳規則表_template.csv':
    'project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv',
  '2026-03-26_銷售商品主檔_template.csv':
    'project_maintainers/data/active/master-data/2026-03-26_銷售商品主檔_template.csv',
  '2026-03-31_內包裝耗材用量對照表_template.csv':
    'project_maintainers/data/active/rules/2026-03-31_內包裝耗材用量對照表_template.csv',
  '2026-03-31_出貨及行政耗材總表_template.csv':
    'project_maintainers/data/active/supplies/2026-03-31_出貨及行政耗材總表_template.csv',
  '2026-04-01_半成品主檔第一版草案.csv':
    'project_maintainers/data/drafts/semifinished/2026-04-01_半成品主檔第一版草案.csv',
  '2026-04-01_原料主檔最低版本草案.csv':
    'project_maintainers/data/drafts/materials-and-recipes/2026-04-01_原料主檔最低版本草案.csv',
};

export function getMaintainerDataRelativePath(fileName: string) {
  const relativePath = maintainerDataRelativePaths[fileName];

  if (!relativePath) {
    throw new Error(`未定義 maintainer data path: ${fileName}`);
  }

  return relativePath;
}