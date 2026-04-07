# 下班前回填規格

更新日期：2026-03-31

Authoritative source：是

## 目的

本文件定義 Ivyhouse OP System 在每日作業尾端，如何把當天完成的數量手工回填到正確庫存桶，並明確說明哪些 family 不做日終回填。

## 核心原則

- 所有回填動作一律由內包裝人員執行。
- 內包裝完成品不會自動轉成可銷售成品。
- 若同一 family 同時存在 sellable 與 inner-pack 兩桶，回填也必須依實際完成結果分別落桶。

## 回填目標桶

### 回填到 inner-pack-finished

- 堅果塔
- 夏威夷豆塔
- 雪花餅
- 瑪德蓮
- 椰棗（部分）
- 糖果（部分）

### 回填到 sellable

- 奶油曲奇
- 西點餅乾
- 杏仁瓦片
- 千層餅乾
- 無調味堅果
- 椰棗（部分）
- 糖果（部分）

### 不做日終回填

- 鐵盒禮盒：現場組裝出貨。
- 紙盒禮盒：現場組裝出貨。
- 濾掛咖啡：採購 / 入庫補貨，不走日製作回填。
- 提袋等加購品：採購 / 入庫補貨，不走日製作回填。

## 雙桶 family 的正式規則

適用 family：

- 奶油曲奇
- 西點餅乾
- 杏仁瓦片
- 糖果
- 椰棗

正式規則：

1. 早上先扣 sellable。
2. sellable 不夠時，固定 1:1 扣 inner-pack。
3. 下班前由內包裝人員手工回填完成數量。
4. 不允許系統自動把 inner-pack 轉成 sellable。

## 與轉換規則的邊界

- `Q1-Q5`、`G1-G5`、`C1-C7` 的整包 / 秤重主體若需要先拆包、轉重量或轉單片，這屬轉換規則，不等於日終回填自動轉桶。
- 日終回填只處理實體完成數量入哪個庫存桶，不處理轉換規則的計算 owner。

## 角色邊界

- 目前 `生產 / 包裝 / 會計 / 主管` 都可操作相關流程，但實際回填執行角色限定為包裝（內包裝）人員。
- 本版暫不要求 maker-checker；後續若導入高風險控管，需再補 approval boundary。

## 關聯文件

- `doc/architecture/flows/daily_inventory_deduction_and_production_planning_spec.md`
- `doc/architecture/flows/inventory_count_adjustment_and_negative_stock_policy.md`