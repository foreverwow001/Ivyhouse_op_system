#!/bin/bash
# setup_workflow.sh - 快速初始化 Agent Workflow 到新專案
# 用法: ./setup_workflow.sh /path/to/new-project [project-name]

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="$(dirname "$SCRIPT_DIR")"  # .github/workflow-core 目錄
REPO_ROOT="$(dirname "$(dirname "$SOURCE")")"

copy_dir_contents() {
  local src="$1"
  local dst="$2"
  if [ -d "$src" ]; then
    mkdir -p "$dst"
    cp -r "$src/." "$dst/"
  fi
}

copy_file_if_exists() {
  local src="$1"
  local dst="$2"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dst")"
    cp "$src" "$dst"
  fi
}

DOWNSTREAM_BOOTSTRAP_TEMPLATE_DIR="$SOURCE/templates/downstream_bootstrap"

# 檢查參數
if [ -z "$1" ]; then
    echo -e "${RED}❌ 錯誤：請提供目標專案路徑${NC}"
    echo ""
    echo "用法: ./setup_workflow.sh /path/to/new-project [project-name]"
    echo ""
    echo "範例:"
    echo "  ./setup_workflow.sh /workspaces/my-new-project"
    echo "  ./setup_workflow.sh /workspaces/my-new-project \"我的新專案\""
    exit 1
fi

TARGET="$1"
PROJECT_NAME="${2:-New Project}"

echo -e "${BLUE}🚀 Agent Workflow 初始化工具${NC}"
echo "=================================="
echo -e "來源: ${YELLOW}$SOURCE${NC}"
echo -e "目標: ${YELLOW}$TARGET${NC}"
echo -e "專案: ${YELLOW}$PROJECT_NAME${NC}"
echo ""

# 確認目標目錄
if [ ! -d "$TARGET" ]; then
    echo -e "${YELLOW}📁 目標目錄不存在，正在建立...${NC}"
    mkdir -p "$TARGET"
fi

# Step 1: 建立目錄結構
echo -e "${BLUE}[1/8] 建立目錄結構...${NC}"
mkdir -p "$TARGET/.github/workflow-core/workflows"
mkdir -p "$TARGET/.github/workflow-core/roles"
mkdir -p "$TARGET/.github/workflow-core/skills"
mkdir -p "$TARGET/.github/workflow-core/scripts"
mkdir -p "$TARGET/.github/workflow-core/runtime"
mkdir -p "$TARGET/.github/workflow-core/templates"
mkdir -p "$TARGET/.workflow-core/skills_local"
mkdir -p "$TARGET/.workflow-core/state/skills"
mkdir -p "$TARGET/.workflow-core/config/skills"
mkdir -p "$TARGET/.workflow-core/backup"
mkdir -p "$TARGET/.workflow-core/mcp"
mkdir -p "$TARGET/doc/plans"
mkdir -p "$TARGET/doc/logs"
mkdir -p "$TARGET/project_maintainers/chat/handoff"
mkdir -p "$TARGET/project_maintainers/chat/archive"
mkdir -p "$TARGET/project_maintainers/improvement_candidates"
mkdir -p "$TARGET/.vscode"
mkdir -p "$TARGET/.devcontainer"
mkdir -p "$TARGET/tools"
echo -e "${GREEN}  ✅ 目錄結構建立完成${NC}"

# Step 2: 複製 Workflow 檔案
echo -e "${BLUE}[2/8] 複製 Workflow 檔案...${NC}"
cp "$SOURCE/AGENT_ENTRY.md" "$TARGET/.github/workflow-core/"
cp "$SOURCE/workflow_baseline_rules.md" "$TARGET/.github/workflow-core/"
cp "$SOURCE/workflows/dev.md" "$TARGET/.github/workflow-core/workflows/"
if [ -d "$SOURCE/workflows/references" ]; then
  copy_dir_contents "$SOURCE/workflows/references" "$TARGET/.github/workflow-core/workflows/references"
fi
echo -e "${GREEN}  ✅ Workflow 檔案複製完成${NC}"

# Step 3: 複製 Roles 檔案
echo -e "${BLUE}[3/8] 複製 Roles 檔案...${NC}"
cp "$SOURCE/roles/coordinator.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/planner.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/engineer.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/engineer_pending_review_recorder.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/qa.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/qa_pending_review_recorder.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/domain_expert.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/security.md" "$TARGET/.github/workflow-core/roles/"
cp "$SOURCE/roles/security_pending_review_recorder.md" "$TARGET/.github/workflow-core/roles/"
echo -e "${GREEN}  ✅ Roles 檔案複製完成${NC}"

# Step 4: 複製 Skills 檔案
echo -e "${BLUE}[4/8] 複製 Skills 檔案...${NC}"
if [ -d "$SOURCE/skills" ]; then
  cp -r "$SOURCE/skills/." "$TARGET/.github/workflow-core/skills/"
fi

if [ ! -f "$TARGET/.workflow-core/config/skills/skill_whitelist.json" ]; then
WHITELIST_TEMPLATE='{
  "version": "1.0",
  "approved_sources": [],
  "approval_policy": {
    "auto_approve_official_orgs": false,
    "require_manual_approval_for_personal_repos": true,
    "minimum_stars": 0,
    "maximum_repo_age_months": 0
  },
  "last_updated": "'$(date -Iseconds)'"
}'
printf '%s\n' "$WHITELIST_TEMPLATE" > "$TARGET/.workflow-core/config/skills/skill_whitelist.json"
fi
echo -e "${GREEN}  ✅ Skills 檔案複製完成${NC}"

# Step 5: 複製 Runtime、Templates 與 downstream skeleton
echo -e "${BLUE}[5/8] 複製 Runtime、Templates 與 downstream skeleton...${NC}"
copy_dir_contents "$SOURCE/runtime" "$TARGET/.github/workflow-core/runtime"
copy_dir_contents "$SOURCE/templates" "$TARGET/.github/workflow-core/templates"
copy_dir_contents "$REPO_ROOT/project_maintainers" "$TARGET/project_maintainers"
echo -e "${GREEN}  ✅ Runtime、Templates 與 downstream skeleton 複製完成${NC}"

# Step 6: 建立初始檔案與模板
echo -e "${BLUE}[6/8] 建立初始檔案與模板...${NC}"

# 建立 active_sessions.json
echo '{"sessions": [], "created": "'$(date -Iseconds)'"}' > "$TARGET/.workflow-core/active_sessions.json"

# 建立 Implementation Plan Index
copy_file_if_exists "$REPO_ROOT/doc/implementation_plan_index.md" "$TARGET/doc/implementation_plan_index.md"
if [ ! -f "$TARGET/doc/implementation_plan_index.md" ]; then
  echo -e "${RED}  ❌ 找不到 canonical implementation_plan_index.md 模板${NC}"
  exit 1
fi

if [ -d "$REPO_ROOT/doc/architecture" ]; then
  copy_dir_contents "$REPO_ROOT/doc/architecture" "$TARGET/doc/architecture"
fi

copy_file_if_exists "$REPO_ROOT/doc/plans/Idx-000_plan.template.md" "$TARGET/doc/plans/Idx-000_plan.template.md"
copy_file_if_exists "$REPO_ROOT/doc/logs/Idx-000_log.template.md" "$TARGET/doc/logs/Idx-000_log.template.md"

if [ ! -f "$TARGET/doc/plans/Idx-000_plan.template.md" ]; then
  cat > "$TARGET/doc/plans/Idx-000_plan.template.md" << 'EOF'
# Idx-NNN: [任務名稱]

> 建立日期: YYYY-MM-DD
> 狀態: Planning
EOF
fi

if [ ! -f "$TARGET/doc/logs/Idx-000_log.template.md" ]; then
  cat > "$TARGET/doc/logs/Idx-000_log.template.md" << 'EOF'
# Idx-NNN: [任務名稱] - Execution Log

> 建立日期: YYYY-MM-DD
> 狀態: Draft | QA | Completed
EOF
fi
echo -e "${GREEN}  ✅ 模板與初始檔案建立完成${NC}"

# Step 7: 建立 downstream workspace / devcontainer / chat customization 啟動面
echo -e "${BLUE}[7/9] 建立 downstream workspace / devcontainer / chat customization 啟動面...${NC}"
copy_file_if_exists "$DOWNSTREAM_BOOTSTRAP_TEMPLATE_DIR/.vscode/settings.json" "$TARGET/.vscode/settings.json"
copy_file_if_exists "$DOWNSTREAM_BOOTSTRAP_TEMPLATE_DIR/.vscode/extensions.json" "$TARGET/.vscode/extensions.json"
copy_file_if_exists "$DOWNSTREAM_BOOTSTRAP_TEMPLATE_DIR/.devcontainer/devcontainer.json" "$TARGET/.devcontainer/devcontainer.json"
copy_dir_contents "$DOWNSTREAM_BOOTSTRAP_TEMPLATE_DIR/.github" "$TARGET/.github"

if [ ! -f "$TARGET/.vscode/settings.json" ] || [ ! -f "$TARGET/.vscode/extensions.json" ] || [ ! -f "$TARGET/.devcontainer/devcontainer.json" ] || [ ! -f "$TARGET/.github/copilot-instructions.md" ]; then
  echo -e "${RED}  ❌ 找不到 canonical downstream workspace / devcontainer / chat customization 模板${NC}"
  exit 1
fi
echo -e "${GREEN}  ✅ downstream workspace / devcontainer / chat customization 啟動面建立完成${NC}"

# Step 8: 複製執行腳本（不含 VS Code 擴充）
echo -e "${BLUE}[8/9] 複製執行腳本...${NC}"

copy_script() {
    local src="$1"
    local dst="$2"
    if [ -f "$src" ]; then
        cp "$src" "$dst"
        chmod +x "$dst/$(basename "$src")" 2>/dev/null || true
    fi
}

copy_script "$SOURCE/scripts/run_codex_template.sh" "$TARGET/.github/workflow-core/scripts/"
copy_script "$SOURCE/scripts/setup_obsidian_surface.sh" "$TARGET/.github/workflow-core/scripts/"
# Note: workflow 預設主路徑是 Copilot Chat + one-shot reviewer。

echo -e "${GREEN}  ✅ 執行腳本複製完成${NC}"

# Step 9: 建立專案規則檔模板
echo -e "${BLUE}[9/9] 建立專案規則檔...${NC}"
copy_file_if_exists "$REPO_ROOT/project_rules.md" "$TARGET/project_rules.md"
if [ ! -f "$TARGET/project_rules.md" ]; then
    echo -e "${RED}  ❌ 找不到 canonical project_rules.md 模板${NC}"
    exit 1
fi

sed -i "1s|\[專案名稱\]|$PROJECT_NAME|" "$TARGET/project_rules.md"
echo -e "${GREEN}  ✅ 專案規則檔建立完成${NC}"

# 更新 AGENT_ENTRY.md 中的 bootstrap 路徑字樣
echo -e "${BLUE}[額外] 更新 AGENT_ENTRY.md 中的 bootstrap 路徑字樣...${NC}"
sed -i 's|./ivy_house_rules.md|./project_rules.md|g' "$TARGET/.github/workflow-core/AGENT_ENTRY.md"
sed -i 's|./docs/implementation_plan_index.md|./doc/implementation_plan_index.md|g' "$TARGET/.github/workflow-core/AGENT_ENTRY.md"
echo -e "${GREEN}  ✅ AGENT_ENTRY.md 更新完成${NC}"

# 完成訊息
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Agent Workflow 初始化完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📝 後續步驟：${NC}"
echo "  1. 編輯 $TARGET/project_rules.md 填入專案資訊"
echo "  2. 確認下游專案的 active rule source 使用 $TARGET/project_rules.md"
echo "  3. 編輯 $TARGET/.github/workflow-core/roles/domain_expert.md 客製化領域專家"
echo "  4. 視專案需要補充 $TARGET/.github/workflow-core/roles/security.md 的高風險面"
echo "  5. 第一次在新專案執行 Reopen in Container / Rebuild Container，讓 .devcontainer/postCreate 安裝 runtime 依賴"
echo "  6. 檢查已 materialize 的 $TARGET/.github/ shared customization skeleton，必要時再依 template repo 的 doc/VSCODE_INSIDER_CHAT_SETUP.md 微調"
echo "  7. 執行 python .github/workflow-core/runtime/scripts/vscode/workflow_preflight_reviewer_cli.py --json 確認 reviewer CLI ready"
echo "  8. 若要在 Explorer 暴露 restricted Obsidian surface，可執行 $TARGET/.github/workflow-core/scripts/setup_obsidian_surface.sh --vault-root /path/to/ObsidianVault"
echo "  9. 在 VS Code 開啟專案，測試輸入 /dev"
echo ""
