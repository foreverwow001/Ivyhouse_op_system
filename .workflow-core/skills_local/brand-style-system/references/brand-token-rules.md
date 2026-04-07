# Brand Token Rules

## 目標

把 Ivyhouse 官網的品牌氣質轉成 Portal 可持續使用的 token，而不是逐頁憑感覺上色。

## 必做規則

- 主背景使用奶油白 / 暖米白系
- 主標題使用深綠系
- 主 CTA 使用暖金 / 焦糖金
- 卡片使用柔和圓角與低對比柔陰影
- 內文與表單使用高可讀 sans-serif

## Token 分層

1. Primitive token：原始色值、字體、圓角、陰影、間距
2. Semantic token：`color-background-page`、`color-text-brand`、`color-accent-primary`
3. Component token：`button-primary-bg`、`card-entry-shadow`、`login-hero-surface`

## Do

- 用同一套 semantic token 驅動 login 與 landing
- 讓 brand display font 只用在品牌主標與主 section title
- 讓 UI font 承擔表單、資料、狀態與說明區

## Don’t

- 不要直接把官網 banner 視覺搬進 Portal
- 不要用多組接近但不一致的米白、棕色、綠色
- 不要讓字體選擇破壞高頻操作可讀性