# Portal Brand Token And Icon Pre-Spec

更新日期：2026-04-04

Authoritative source：是

## 目的

本文件把 `portal_ui_ux_baseline.md` 中的品牌視覺要求進一步收斂為可執行的前置規格，供 `Idx-023` 在開始實作 login page、landing page 與入口卡片前使用。

本文件回答的是：

1. 第一版 Portal 應採用哪些品牌 token。
2. 哪些 token 只是初始提案，後續如何驗證。
3. 2.5D icon 在第一版應如何定義，不讓實作時語義漂移。

## 適用範圍

- login page
- landing page
- 流程節點 icon
- 模組入口卡片
- Portal 第一版共用按鈕、卡片、標題與背景 token

本文件不直接規定資料表、API、RBAC 或 page routing。

## 輸入來源

### 1. 官網品牌視覺

- 來源：`https://www.ivyhousetw.com`
- 主要抽象特徵：
  - 奶油白 / 暖米白背景
  - 深綠主標題
  - 暖金 / 焦糖金強調色
  - 柔和禮盒與烘焙感材質
  - 高級但不冷硬的品牌氣質

### 2. 內部工具入口卡片風格

- 來源：`https://picking-order-analyzer.pages.dev/`
- 主要抽象特徵：
  - 極簡頁面結構
  - 中央大標
  - 大面積留白
  - 大型圓角卡片
  - icon 居中 + 標題 + 短說明 + 單一 CTA

### 3. 使用者補充要求

- style 要接近官網
- icon、選擇區塊、選擇 card 要接近現有簡貨單分析系統
- icon 要「可愛且典雅的 2.5D」

## 第一版 token 設計原則

### 1. 先求一致，不先求全

- 第一版只需要足以支撐 login page、landing page 與入口卡片。
- 不要在第一輪就把所有模組頁的完整 design system 做滿。

### 2. 以 semantic token 為主，不直接散用色碼

- 前端實作時應先落 semantic token，再對應到 primitive token。
- 不允許在頁面元件內直接硬寫多組接近但不一致的米白、棕色、綠色。

### 3. 品牌標題字與資料區字體分流

- Portal 可以有品牌感標題字。
- 但資料表、表單、狀態、說明文要以高可讀 sans-serif 為主。

### 4. Icon 規則先定語言，再定資產來源

- 第一版先定 icon 語言、角度、陰影、色系、材質與禁止事項。
- 資產來源可在後續決定是自繪、生成後人工修正，或外包 / 素材庫。

## 第一版色彩 token 提案

### Primitive tokens

以下色票為依官網視覺語言提出的第一版提案，實作前可用於建立初版 theme，並在第一輪畫面完成後再微調。

| Token | 建議值 | 用途 |
|---|---|---|
| `color-cream-50` | `#FBF7F1` | 全站最外層背景、柔白底 |
| `color-cream-100` | `#F4EBDD` | 次背景、hero 柔和底色 |
| `color-beige-200` | `#E9DCC8` | 區塊分隔、淺卡片邊界 |
| `color-gold-400` | `#D8B06A` | 輕 accent、分隔線、icon 高光 |
| `color-gold-500` | `#C99A4B` | 主 CTA、重點按鈕 |
| `color-cocoa-500` | `#8A6244` | 次標、icon 側面、輔助強調 |
| `color-cocoa-700` | `#6B4A33` | 深色按鈕文字 / icon 深陰影 |
| `color-ivy-700` | `#2F4F48` | 品牌主標題、主要 heading |
| `color-ivy-800` | `#243D38` | 深標題、關鍵資訊、icon 主深色面 |
| `color-neutral-600` | `#6E6A64` | 次要文字 |
| `color-neutral-800` | `#3D3935` | 主要內文文字 |
| `color-white` | `#FFFFFF` | 卡片內容底、輸入欄底 |

### Semantic tokens

| Token | 對應值 | 用途 |
|---|---|---|
| `color-background-page` | `color-cream-50` | 頁面主背景 |
| `color-background-panel` | `color-white` | 卡片 / 表單底色 |
| `color-background-soft` | `color-cream-100` | hero、次區塊背景 |
| `color-text-primary` | `color-neutral-800` | 一般內文 |
| `color-text-secondary` | `color-neutral-600` | 次要說明 |
| `color-text-brand` | `color-ivy-700` | 品牌主標題 |
| `color-accent-primary` | `color-gold-500` | 主要 CTA / 關鍵 accent |
| `color-accent-secondary` | `color-cocoa-500` | 次級 accent |
| `color-border-soft` | `color-beige-200` | 卡片 / 輸入框邊界 |
| `color-icon-primary` | `color-ivy-700` | icon 主色 |
| `color-icon-highlight` | `color-gold-400` | icon 高光 |
| `color-icon-depth` | `color-cocoa-500` | icon 立體側面 |

## 功能色建議

第一版仍需準備功能色，但要與品牌語氣協調。

| Token | 建議值 | 用途 |
|---|---|---|
| `color-success` | `#6C9A6B` | 成功狀態、完成 |
| `color-warning` | `#D2A14A` | 注意、待確認 |
| `color-error` | `#B75A52` | 錯誤、失敗 |
| `color-info` | `#6E8FA8` | 提示、資訊狀態 |

規則：功能色可用於 state，但主視覺仍以品牌色系為核心。

## 字體 token 提案

### 第一版字體組合原則

- 中文品牌主標：優雅襯線或高級感 display serif
- 英文品牌副標：帶 letter spacing 的 refined sans 或 serif
- 內文 / 表單 / 表格：高可讀 sans-serif

### Token 建議

| Token | 建議值 | 用途 |
|---|---|---|
| `font-family-display-zh` | `"Noto Serif TC", "Songti TC", serif` | 中文品牌主標 |
| `font-family-display-en` | `"Cormorant Garamond", "Times New Roman", serif` | 英文品牌副標或 display 英文 |
| `font-family-ui` | `"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif` | 表單、狀態、清單、卡片說明 |

### 字級階梯提案

| Token | 建議值 | 用途 |
|---|---|---|
| `font-size-display` | `56px` | login / landing 主標 |
| `font-size-h1` | `40px` | 頁面主標 |
| `font-size-h2` | `28px` | 區塊標題 |
| `font-size-h3` | `22px` | 卡片標題 |
| `font-size-body-lg` | `18px` | landing 說明文字 |
| `font-size-body` | `16px` | 一般內文 |
| `font-size-label` | `14px` | label / helper / meta |

規則：登入與 landing 可使用 display 級標題；日後資料密集頁應以 `font-family-ui` 為主。

## 圓角、陰影與間距 token 提案

| Token | 建議值 | 用途 |
|---|---|---|
| `radius-card` | `28px` | 大型入口卡片 |
| `radius-panel` | `20px` | 一般卡片 / 區塊 |
| `radius-input` | `16px` | 輸入框 |
| `radius-button` | `999px` | 品牌 CTA |
| `shadow-soft` | `0 18px 50px rgba(107, 74, 51, 0.10)` | Hero / 主卡片 |
| `shadow-card` | `0 12px 32px rgba(47, 79, 72, 0.08)` | 一般卡片 |
| `space-1` | `4px` | 細小間距 |
| `space-2` | `8px` | 緊密元件間距 |
| `space-3` | `12px` | 元件內群組 |
| `space-4` | `16px` | 一般 padding |
| `space-6` | `24px` | 區塊內間距 |
| `space-8` | `32px` | 卡片 / panel 間距 |
| `space-12` | `48px` | 大區塊分隔 |

## 2.5D icon 前置規格

### icon 家族定位

第一版應建立同一家族的功能 icon，至少覆蓋：

- login 輔助插圖
- landing page 主流程節點
- 模組入口卡片
- empty state

### 幾何規則

- 主形狀以圓角矩形、文件、盒體、包裝、工具、報表、原料容器等可辨識物件為基礎。
- 體積感來自「正面 + 側面 + 高光面」，不使用複雜 3D 模型。
- 透視角度保持一致，建議採輕微右上 / 左上斜視角。

### 光影規則

- 一主光源，建議由左上打光。
- 正面用品牌主色或中性色，側面用較深 1 階色，頂面或邊緣加高光。
- 陰影必須柔和，不可厚重或遊戲式高對比投影。

### 風格邊界

- 可愛：圓潤、親和、降低內部工具壓迫感。
- 典雅：節制彩度、節制表情化裝飾、保持品牌可信賴感。
- 禁止：Q 版貼圖感、兒童教材感、過度糖果色、廉價 app icon 感。

### icon 樣本需求

在正式畫面實作前，至少要先產出下列 8 類樣本：

1. 登入 / Portal 品牌入口
2. 訂單 / 需求
3. 採購 / 進貨
4. 庫存 / 倉庫
5. 生產 / 排程
6. 出貨 / 包裝
7. 報表 / 分析
8. 設定 / 主資料

### 資產策略選項

可接受的第一版策略：

1. AI 生成後人工修正到同一風格
2. 手工繪製或委外繪製少量核心 icon
3. 以同一套可商用素材庫做基底，再統一修色與陰影

不可接受：

- 每個模組用不同來源、不同厚度、不同陰影語言的 icon 混搭
- 第一版先用 emoji 或扁平線框暫代正式 landing 主節點

## 實作前驗證清單

在開始 login / landing 實作前，應先完成以下前置確認：

1. token 已整理成單一可引用清單
2. 已確認 brand display font 與 UI font 的 fallback 策略
3. 已準備至少 8 個 2.5D icon 樣本或明確產製策略
4. 已確認主按鈕、次按鈕、卡片、表單欄位的 token 用法
5. 已確認品牌 token 不會讓表單與狀態文字對比不足

## Done 定義

本前置規格視為 ready for implementation 的條件：

1. 前端可直接依本文件建立 theme token 與基本 design constants
2. 設計 / 實作雙方對 2.5D icon 語言有同一理解
3. login 與 landing page 第一版不需再重開品牌方向討論

## 關聯文件

- `doc/architecture/modules/portal_ui_ux_baseline.md`
- `doc/plans/Idx-023_plan.md`