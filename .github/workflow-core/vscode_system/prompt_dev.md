# Prompt：/dev

用於啟動 Ivy Coordinator 流程的 prompt 檔案。

---

## 基本資訊（請完整填寫）

### 目標（一句話）
> [填寫目標]

### 詳細需求
> 用例、邊界條件、期望結果

### 預期白名單檔案（相對路徑）
> 列出允許變更的檔案（如適用）

### research_required
> `true` / `false`

### 驗收條件（必要）
> 逐條列出驗收標準

### max_rounds（預設為 3）
> 預期最多執行輪數

---

## 啟動指令（給 Ivy Coordinator）

請以 Ivy Coordinator 身份先回傳：

1. **你理解的目標**（簡短）
2. **不做清單**（Out of Scope）
3. **驗收條件草案**（逐條）
4. **是否需要 Expert Review**（Yes/No）

並以 batched `#askQuestions` 等待確認後再進入執行；不得把 formal gate 改成一般聊天補填。

若 `READ_BACK_REPORT` 已通過、且準備進入正式 `/dev` 任務，先建立 fresh context boundary：Engineer 使用新的 Copilot Chat turn / custom agent mode，reviewer 使用新的 one-shot reviewer session，再進 Mode Selection Gate / Plan。

---

## Gate/檢查需要 git 輸出時

由使用者在 Project terminal 執行並貼回：

```bash
# 列出變更檔案
git status --porcelain | awk '{print $2}'

# 計算變更行數
git diff --numstat | awk '{add+=$1; del+=$2} END {print add+del}'
```

---

## 備援（reviewer 無法執行）

請使用者修復 `copilot` CLI，或改由人工 reviewer 提供固定格式的 review 結果。

---

## 語言

繁體中文
