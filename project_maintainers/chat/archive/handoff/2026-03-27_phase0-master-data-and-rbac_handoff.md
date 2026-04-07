# SESSION-HANDOFF

## Current goal

- 本輪已完成 Phase 0 主資料、流程、shared key 與 RBAC 的第一批基線補強，重點是把原本只停留在 CSV 治理的結果，升格為正式權威文件與 artifact。
- 下一位接手者若延續本主題，優先目標不是再憑空補欄位，而是直接用 `vscode_askQuestions` 分段收集使用者從接單到出貨的真實工作流程，再把答案對回目前的主資料、流程與 RBAC 缺口。

## Current branch

- `main`

## Active environment

- Dev Container / Debian GNU/Linux 12
- 主要工作方式：文件與 CSV 治理為主，尚未進入應用程式程式碼實作
- Python 環境：workspace 內 `venv`
- 注意：這個 repo 的 CSV 曾出現 `read_file` 顯示舊內容、但磁碟實際內容已更新的情況；涉及 CSV 現況時應以 terminal / 實際磁碟檢查為準

## Files touched

- `doc/implementation_plan_index.md`
- `doc/architecture/README.md`
- `doc/architecture/data/README.md`
- `doc/architecture/data/master_data_dictionary.md`
- `doc/architecture/data/shared_key_contract.md`
- `doc/architecture/flows/README.md`
- `doc/architecture/flows/unified_status_semantics.md`
- `doc/architecture/flows/shipping_supply_inventory_policy.md`
- `doc/architecture/roles/README.md`
- `doc/plans/Idx-003_plan.md`
- `doc/logs/Idx-003_log.md`
- `doc/plans/Idx-004_plan.md`
- `doc/logs/Idx-004_log.md`
- `doc/plans/Idx-005_plan.md`
- `doc/logs/Idx-005_log.md`
- `doc/plans/Idx-006_plan.md`
- `doc/logs/Idx-006_log.md`
- `project_maintainers/data/active/master-data/2026-03-25_外包裝材料主檔_template.csv`
- `project_maintainers/data/active/master-data/2026-03-25_內包裝完成品主檔_template.csv`
- `project_maintainers/data/active/rules/2026-03-25_單位換算規則表_template.csv`
- `project_maintainers/data/active/rules/2026-03-25_生產_分裝_轉換扣帳規則表_template.csv`

## Updates after this handoff

- 已新增 `doc/architecture/project_blueprint_alignment_draft.md`，把藍圖目標、目前權威文件與仍未補齊的產品藍圖缺口收斂成單一對照表草案。
- 已完成把 2026-03-23 的 workflow / template 治理文檔與目前 repo 狀態對齊，確認其中部分「未完成項」其實已被後續工作補上，不應再直接當成即時待辦清單。
- 已完成 `project_maintainers/chat/`（忽略 `handoff/`）的第一輪全面掃描，並整理成三欄可執行分類：保留在 chat、移到 archive、內容重寫後上移到 `doc/architecture`。
- 已確認 `project_maintainers/chat/README.md` 的定位是 supporting operational memory，不是 authoritative source；因此 chat 內的活資料載體不應直接整批搬到權威文件目錄。
- 已確認以下三份說明檔屬「內容可吸收，但不應原樣上移」：
  - `project_maintainers/data/notes/2026-03-25_六張CSV最終版欄位對照摘要.md`
  - `project_maintainers/data/notes/2026-03-25_四張主資料工作表說明.md`
  - `project_maintainers/data/notes/2026-03-24_銷售商品組成對照表_template_README.md`
- 已將以下一次性分析 / 提案檔正式移入 `project_maintainers/chat/archive/`：
  - `2026-03-24_picking-order-analyzer-product-catalog.md`
  - `2026-03-25_內包裝新增項與外包裝材料_SKU編碼提案表.csv`

## What has been confirmed

- 四張治理 CSV 已補上生命週期與審計欄位：`生效日`、`失效日`、`停用原因`、`來源建立方式`；兩張高風險規則表另有 `核定狀態`、`核定人`、`核定日期`。
- 四張表目前實際磁碟狀態：
  - 外包裝材料主檔 19 筆 `啟用`
  - 內包裝完成品主檔 70 筆 `啟用`
  - 單位換算規則表 38 筆 `啟用`
  - 生產 / 分裝 / 轉換扣帳規則表 29 筆 `啟用`
- 規則表的過渡核定值已回收為正式值：
  - `核定狀態 = 正式核定`
  - `核定人 = 倉管`
  - `核定日期 = 2026/3/26`
- Idx-003、Idx-004、Idx-006 已建立 plan/log artifact；Idx-005 也已建立並完成第一輪 Security Review 與 cross-QA，狀態已推進到 `QA`。
- 已新增正式權威文件：
  - 第一版主資料字典 `doc/architecture/data/master_data_dictionary.md`
  - 統一狀態語意 `doc/architecture/flows/unified_status_semantics.md`
  - 第一版 RBAC / approval matrix `doc/architecture/roles/README.md`
  - 出貨用品人工盤點與調整規則 `doc/architecture/flows/shipping_supply_inventory_policy.md`
- 已確認的治理結論：
  - 原料 / 食材必須進 ERP，屬正式主資料
  - 配方必須進 ERP，且必須版本化
  - 出貨用品 / 包裝耗材必須進 ERP，但目前流程採人工盤點，不在出貨時自動扣除
  - 內包裝包材不是人工盤點型出貨用品，而是正式扣帳型包材
  - 內包裝包材與外包裝材料不再分成兩份平行主資料，而是併入同一份包材主檔治理
- `project_maintainers/chat/` 內的活 CSV 與原始 `xlsx` 目前仍應留在 chat，作為 working source，不應直接搬到 `doc/architecture/`。
- 三份 chat 說明檔目前已有不同程度過時或只代表過程性整理，若要成為權威內容，應採「重寫吸收」而不是「原檔搬家」。
- 已完成第一輪低風險整理：兩份一次性分析 / 提案檔已移入 `project_maintainers/chat/archive/`，目前沒有建議直接刪除的檔案。

## Current stage

- 目前處於 Phase 0 文件骨架已能支撐下一輪需求收集的階段。
- 主資料、流程與 RBAC 的第一版基線已經可用，但尚未補到足以直接設計 ERP schema 或完整 state machine。
- 產品藍圖缺口與 workflow / template 治理缺口已完成一次明確拆分；後續 roadmap 應優先回到產品缺口，而不是再把已完成的治理項目重複列為待辦。
- `project_maintainers/chat/` 的 supporting memory 與 authoritative docs 邊界已做完第一輪收斂，低風險 archive 已開始執行。
- 下一步有兩條明確路徑：
  - 若延續文件治理，應先把三份 chat 說明檔的有效內容重寫吸收到 `doc/architecture/`。
  - 若回到業務建模，最有價值的工作仍是把使用者的真實工作流程收集成結構化輸入，尤其是「接單 -> 生產 -> 包裝 -> 出貨」這條主線。

## What was rejected

- 不採用把內包裝包材獨立成另一份平行主檔的做法。
- 不採用把內包裝包材歸到出貨用品 / 包裝耗材、只做人工盤點的做法。
- 不採用讓出貨用品在出貨時自動扣除的假設；目前已確認這類用品採人工盤點維護。
- 不採用把資料治理規則只留在聊天紀錄，而不落到 `doc/architecture/` 權威文件的做法。
- 不採用把仍在使用的 CSV / `xlsx` 工作載體直接搬進 `doc/architecture/` 的做法。
- 不採用把已部分過時的 chat 說明檔原樣搬家到權威文件目錄的做法。
- 不採用在沒有保留歷史脈絡的前提下直接刪除一次性分析 / 提案檔；目前優先歸檔，不直接刪除。

## Next exact prompt

- 若要先延續文件治理：請先把這三份 chat 說明檔的有效內容對應到 `doc/architecture/` 應落的位置，列出「來源檔 -> 目標權威文件 -> 要吸收的重點」，再決定是否直接起草重寫：
  1. `2026-03-25_六張CSV最終版欄位對照摘要.md`
  2. `2026-03-25_四張主資料工作表說明.md`
  3. `2026-03-24_銷售商品組成對照表_template_README.md`
- 若要回到業務流程收集：請直接用 `vscode_askQuestions` 幫我把目前真實工作流程拆成幾段來收集，不用我一次自己整理成完整文件；優先依這個順序收：
  1. 訂單怎麼來、誰接單、接單後先記哪些資訊
  2. 接單後如何判斷要不要生產、是否看現貨、是否拆成工單或製作單
  3. 生產前要準備哪些原料、半成品、內包裝包材、外包材
  4. 生產與分裝時哪些項目需要正式扣帳，哪些只是作業輔助
  5. 完工後如何入庫、如何區分可銷售品 / 半成品 / 待包裝品
  6. 包裝與出貨時會用到哪些內外包材、哪些用品不自動扣除
  7. 出貨後如何盤點、補貨、調整與追差異
  接著把收集結果對回目前的主資料字典、流程文件與 RBAC 缺口，整理出下一輪最該補的資料結構與流程規格。

## Risks

- 雖已建立產品藍圖對照表草案，但 repo 內仍缺正式採納的專案總覽文件與 Phase 1 MVP scope。
- 原料目前只有主資料層最低定義，仍缺採購條件、供應商映射、批次 / 效期細節。
- 配方目前只有版本主檔骨架，仍缺 BOM 明細、產出率、替代料與核定流程。
- 包材主檔目前只完成邊界定義，仍缺細部欄位規格、包材分類與哪些情境要走正式扣帳的更細準則。
- 出貨用品流程雖已定義為人工盤點，但仍缺盤點週期、調整原因字典與角色邊界細則。
- `核定人` 目前仍是角色層級，不是人員層級。
- 全系統 RBAC、完整 workflow state machine、API / auth / row-level security 仍未建立。
- 三份 chat 說明檔雖已分類為「重寫後上移」，但其有效內容尚未真正吸收到 `doc/architecture/`，因此 supporting memory 與 authoritative docs 的分工仍未完全收斂。

## Verification status

- 已驗證：
  - 本輪新增或修改的權威文件均無 editor error
  - 兩張規則表的正式核定值已回寫為 `正式核定 / 倉管 / 2026/3/26`
  - Idx-005 已完成第一輪 Security Review 與 cross-QA，狀態已推進到 `QA`
  - 主資料字典、流程 README、RBAC 文件與 CSV 欄位語意已對齊
  - `project_maintainers/chat/` 已完成第一輪分類；兩份已選定的 archive 檔案已不在 chat 根目錄，且已出現在 `project_maintainers/chat/archive/`
- 尚未驗證：
  - 使用者實際接單到出貨流程與目前文件假設是否完全一致
  - 原料、配方、包材、出貨用品的細部欄位與例外路徑
  - 是否需要再拆出新的獨立 work unit 來承接原料 / 配方 / 包材細則
  - 三份 chat 說明檔重寫後應如何分別掛接到現有 `doc/architecture/` 權威文件