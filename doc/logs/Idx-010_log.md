# Idx-010: 四渠道特殊項治理基線第一版 - Execution Log

> 建立日期: 2026-03-30
> 狀態: Completed

---

## ARTIFACT_CHAIN

- task_id: `Idx-010`
- index_file_path: `doc/implementation_plan_index.md`
- plan_file_path: `doc/plans/Idx-010_plan.md`
- log_file_path: `doc/logs/Idx-010_log.md`

## WORKFLOW_SUMMARY

### Goal

為 `補寄商品專用/勿下單`、咖啡與 `提袋加購` 建立正式治理分類，作為下一步 `matchedProductName -> 銷售商品SKU_正式` 接線的依據。

### Scope

- 建立特殊項治理規則文件
- 補 plan / log / index 關聯
- 補 data 架構入口與 mapping 治理文件關聯

## EXECUTION_SUMMARY

| Item | Value |
|------|-------|
| executor_tool | copilot-cli |
| security_reviewer_tool | N/A |
| qa_tool | Explore |
| last_change_tool | copilot-cli |
| qa_result | PASS_WITH_RISK |
| commit_hash | pending |

## DETERMINISTIC_GATES

| Gate | Result | Notes |
|------|--------|-------|
| Research Gate | PASS | 已交叉閱讀 sellable product spec、shared key contract、mapping governance、exception spec 與 CSV 主資料樣板 |
| Maintainability Gate | PASS | 以獨立治理文件承接特殊項，不把分類邏輯散落在 runtime 判斷 |
| UI-UX Gate | N/A | 本輪無畫面與互動調整 |
| Evidence Gate | PASS | 決策均可追溯到現有權威文件與主資料樣板證據 |
| Security Gate | PASS_WITH_NOTE | 未碰 auth / secret / schema，但 `提袋加購` 與補寄流程後續仍屬高風險資料治理面 |
| Domain Gate | PASS_WITH_RISK | 咖啡與提袋加購已能以現有主資料結構承接；補寄標記的正式作業流程仍待後續補模型 |
| Plan Validator Gate | PASS | 範圍維持文件層，不跨入 runtime / schema |
| Preflight Gate | PASS | 無權威文件衝突，且本輪不涉及 code change confirmation requirement |

## SKILLS_EXECUTION_REPORT

| Skill | Target | Status | Summary | Timestamp |
|------|--------|--------|---------|-----------|
| Explore | Idx-010 closure cross-QA | completed | 驗證三類特殊項治理分類、owner 邊界與下一步 SKU bridge 前置條件已足以完成第一版關帳 | 2026-04-03 17:20:00 |

## QA_SUMMARY

- 結論：PASS_WITH_RISK
- 風險：`提袋加購` 若後續出現多尺寸 / 多袋型 SKU，仍需補 channel alias 與主資料粒度決策；`補寄商品專用/勿下單` 的正式交易模型尚未建立

## ✅ COMPLETION_DECISION

- 關帳判定：可由 `In Progress` 轉為 `Completed`
- 理由：三類特殊項的分類、owner、例外路徑、SKU bridge 前置條件與禁止事項都已正式文件化，且 Explore cross-QA 未發現阻斷缺口
- deferred 範圍：補寄 / 重送正式交易模型，以及 `提袋加購` 多尺寸 / 多袋型粒度擴張

## EVIDENCE

- `doc/architecture/data/sellable_product_master_spec.md` 已將咖啡 40 / 60 包盒裝列入正式銷售商品範圍
- `doc/architecture/data/shared_key_contract.md` 與 `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv` 已存在咖啡單包內包裝 key `K1001-K4001`
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` 已存在咖啡單包、40 / 60 包盒裝與綜合盒裝 sellable 組成樣板
- `doc/architecture/flows/channel_intake_exception_resolution_spec.md` 已要求 `提袋加購`、咖啡若未建檔需進未映射例外，而非靜默忽略
- `doc/architecture/data/README.md` 已明定提袋屬出貨用品 / 包裝耗材主資料，不得與 sellable owner 混用
- `project_maintainers/data/active/master-data/2026-03-26_銷售商品主檔_template.csv` 已以正式 SKU `O00001 / 提袋加購 / 單入提袋` 建立 sellable row
- `project_maintainers/data/active/master-data/1-2026-03-24_銷售商品組成對照表_template.csv` 已補 `O00001 -> PK0014` outer-pack-only 組成 row
- intake bootstrap runtime 已可把 `提袋加購` 直接映射到 `O00001`
- 已依最新 `銷售商品主檔` 校驗並同步 68 筆組成表 SKU consumer 對接碼，避免組成表與主檔改碼後失配
- coffee direct lookup 與 fixture 已同步對齊主檔修正後的 `K*` SKU
- 已新增 `bag_family_naming_and_alias_rules.md`，定義 `提袋加購` family 的命名與 alias 擴充規則
- Explore cross-QA 已確認本 work unit 屬文件 / 治理關帳，不需反向擴張 runtime / schema 才能視為完成

## DECISIONS

- `補寄商品專用/勿下單` 定位為作業標記，不升成正式銷售商品，也不得作為 bootstrap SKU lookup 對象
- 咖啡家族定位為正式銷售商品家族；下游仍需透過內包裝完成品與外包裝材料完成扣帳與組成追溯
- `提袋加購` 定位為正式可販售附加購商品，但底層實體仍應引用 `出貨用品 / 包裝耗材` 主資料，不得直接用 `PK` key 充當 sellable SKU
- `提袋加購` 目前依主檔正式 SKU `O00001` 落地單一 active 商品，底層仍引用 `PK0014`，未來若擴成多尺寸 / 多袋型仍需補正式粒度治理
- 提袋 family 已補命名與 alias 規則；未來若新增尺寸 / 袋型，應先補 alias inventory，再調整 runtime

## OPEN_RISKS

- `提袋加購` 目前只落一筆單一 active SKU；若後續出現多袋型 / 多尺寸 / 多價位，仍需補正式粒度與 alias 治理
- `補寄商品專用/勿下單` 若要進一步自動化，需另立補寄 / 重送流程狀態與責任邊界
- 未來若 `提袋加購` 擴成多尺寸 / 多袋型 SKU，仍需補 alias、粒度與對應 runtime rule