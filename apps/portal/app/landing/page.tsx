"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { clearPortalSession, readPortalSession, type PortalSession } from "../../lib/portal-session";

type FlowNodeStatus = "available" | "coming-soon";

type FlowNodeIcon =
  | "intake"
  | "daily-ops"
  | "planning"
  | "inventory"
  | "master"
  | "procurement"
  | "shipping"
  | "analytics"
  | "finance";

type FlowNode = {
  key: string;
  title: string;
  description: string;
  group: string;
  status: FlowNodeStatus;
  intendedPath: string;
  note: string;
  roles: string[];
  icon: FlowNodeIcon;
};

const availableNodeHrefMap: Partial<Record<FlowNode["key"], string>> = {
  intake: "/intake",
  "daily-ops": "/daily-ops",
  "production-planning": "/daily-ops?view=planning",
  "inventory-count": "/daily-ops?view=inventory-count",
};

const flowNodes: FlowNode[] = [
  {
    key: "intake",
    title: "需求匯入",
    description: "上傳並確認每日需求批次，作為後續作業起點。",
    group: "今日營運主線",
    status: "available",
    intendedPath: "/intake",
    note: "第一版先保留入口策略與模組承接位，正式頁面後續接入。",
    roles: ["會計", "主管", "行政"],
    icon: "intake",
  },
  {
    key: "daily-ops",
    title: "當日扣帳",
    description: "查看正式扣帳與當前庫存影響，處理日常營運核心作業。",
    group: "今日營運主線",
    status: "available",
    intendedPath: "/daily-ops",
    note: "對齊目前後端主線，維持為 landing 中央入口之一。",
    roles: ["生產", "包裝及出貨", "會計", "主管"],
    icon: "daily-ops",
  },
  {
    key: "production-planning",
    title: "生產規劃",
    description: "建立隔日排工並重算相關準備節奏。",
    group: "今日營運主線",
    status: "available",
    intendedPath: "/production-planning",
    note: "此切片只先建入口殼層，後續再掛正式工作頁。",
    roles: ["生產", "包裝及出貨", "主管"],
    icon: "planning",
  },
  {
    key: "inventory-count",
    title: "盤點調整",
    description: "建立盤點 session，追蹤差異並準備調整。",
    group: "今日營運主線",
    status: "available",
    intendedPath: "/inventory-count",
    note: "保留為可用主節點，但目前只提供入口與狀態展示。",
    roles: ["生產", "包裝及出貨", "會計", "主管"],
    icon: "inventory",
  },
  {
    key: "master-data",
    title: "主資料",
    description: "維護原料、配方、門市倉庫與對照規則。",
    group: "治理與設定",
    status: "available",
    intendedPath: "/master-data",
    note: "治理型模組放在次核心區，避免搶過今日營運主線。",
    roles: ["owner", "主管"],
    icon: "master",
  },
  {
    key: "procurement",
    title: "採購 / 收貨",
    description: "保留原料補貨與收貨定位，第一版先作 future node。",
    group: "延伸流程與後續能力",
    status: "coming-soon",
    intendedPath: "/procurement",
    note: "coming soon",
    roles: ["採購"],
    icon: "procurement",
  },
  {
    key: "shipping",
    title: "包裝 / 出貨",
    description: "呈現履約與出貨位置，避免使用者誤判流程缺口。",
    group: "延伸流程與後續能力",
    status: "coming-soon",
    intendedPath: "/shipping",
    note: "coming soon",
    roles: ["包裝及出貨", "會計", "主管"],
    icon: "shipping",
  },
  {
    key: "analytics",
    title: "報表 / 分析",
    description: "保留經營分析與稽核檢視的流程定位。",
    group: "延伸流程與後續能力",
    status: "coming-soon",
    intendedPath: "/analytics",
    note: "coming soon",
    roles: ["主管", "會計", "稽核"],
    icon: "analytics",
  },
  {
    key: "finance",
    title: "財務 / 對帳",
    description: "先顯示與主線相連的財務收尾節點，不提前擴張實作。",
    group: "延伸流程與後續能力",
    status: "coming-soon",
    intendedPath: "/finance",
    note: "coming soon",
    roles: ["會計", "主管"],
    icon: "finance",
  },
];

const primaryNodes = flowNodes.filter((node) => node.group === "今日營運主線");
const governanceNodes = flowNodes.filter((node) => node.group === "治理與設定");
const futureNodes = flowNodes.filter((node) => node.group === "延伸流程與後續能力");

function FlowIcon({ kind }: { kind: FlowNodeIcon }) {
  const featureMap: Record<FlowNodeIcon, ReactNode> = {
    intake: (
      <>
        <rect x="31" y="36" width="34" height="28" rx="7" className="icon-feature-primary" />
        <rect x="37" y="43" width="22" height="4" rx="2" className="icon-feature-secondary" />
        <rect x="37" y="51" width="18" height="4" rx="2" className="icon-feature-secondary" />
      </>
    ),
    "daily-ops": (
      <>
        <rect x="30" y="34" width="36" height="30" rx="8" className="icon-feature-primary" />
        <path d="M38 50h20" className="icon-stroke" />
        <path d="M42 43h12" className="icon-stroke" />
        <circle cx="40" cy="57" r="5" className="icon-feature-highlight" />
      </>
    ),
    planning: (
      <>
        <rect x="30" y="34" width="36" height="30" rx="8" className="icon-feature-primary" />
        <rect x="37" y="39" width="8" height="8" rx="3" className="icon-feature-highlight" />
        <rect x="49" y="39" width="10" height="8" rx="3" className="icon-feature-secondary" />
        <path d="M38 55h20" className="icon-stroke" />
      </>
    ),
    inventory: (
      <>
        <rect x="28" y="36" width="40" height="28" rx="8" className="icon-feature-primary" />
        <rect x="36" y="30" width="24" height="10" rx="4" className="icon-feature-highlight" />
        <path d="M40 50h16" className="icon-stroke" />
      </>
    ),
    master: (
      <>
        <rect x="30" y="34" width="36" height="30" rx="8" className="icon-feature-primary" />
        <circle cx="48" cy="49" r="8" className="icon-feature-highlight" />
        <path d="M48 41v16" className="icon-stroke" />
        <path d="M40 49h16" className="icon-stroke" />
      </>
    ),
    procurement: (
      <>
        <rect x="29" y="36" width="38" height="28" rx="8" className="icon-feature-primary" />
        <path d="M36 49h24" className="icon-stroke" />
        <path d="M50 41l10 8-10 8" className="icon-stroke" />
      </>
    ),
    shipping: (
      <>
        <rect x="28" y="40" width="42" height="24" rx="8" className="icon-feature-primary" />
        <rect x="34" y="34" width="18" height="10" rx="4" className="icon-feature-highlight" />
        <circle cx="39" cy="66" r="4" className="icon-feature-secondary" />
        <circle cx="59" cy="66" r="4" className="icon-feature-secondary" />
      </>
    ),
    analytics: (
      <>
        <rect x="30" y="34" width="36" height="30" rx="8" className="icon-feature-primary" />
        <rect x="37" y="50" width="6" height="10" rx="3" className="icon-feature-highlight" />
        <rect x="46" y="44" width="6" height="16" rx="3" className="icon-feature-secondary" />
        <rect x="55" y="40" width="6" height="20" rx="3" className="icon-feature-highlight" />
      </>
    ),
    finance: (
      <>
        <rect x="30" y="34" width="36" height="30" rx="8" className="icon-feature-primary" />
        <circle cx="48" cy="49" r="10" className="icon-feature-highlight" />
        <path d="M48 42v14" className="icon-stroke" />
        <path d="M44 45c1-2 3-3 4-3s3 1 4 3" className="icon-stroke" />
        <path d="M44 53c1 2 3 3 4 3s3-1 4-3" className="icon-stroke" />
      </>
    ),
  };

  return (
    <svg className="flow-icon" viewBox="0 0 96 96" aria-hidden="true">
      <path d="M24 31h42l10 8v28H34l-10-8V31Z" className="icon-face-top" />
      <path d="M24 31v28l10 8V39l-10-8Z" className="icon-face-side" />
      <rect x="34" y="39" width="42" height="28" rx="10" className="icon-face-front" />
      {featureMap[kind]}
    </svg>
  );
}

function FlowNodeCard({
  node,
  isSelected,
  onSelect,
}: {
  node: FlowNode;
  isSelected: boolean;
  onSelect: (nodeKey: string) => void;
}) {
  const isAvailable = node.status === "available";

  return (
    <article
      className={[
        "node-card",
        isAvailable ? "node-card-available" : "node-card-coming-soon",
        isSelected ? "node-card-selected" : "",
      ].join(" ")}
    >
      <div className="node-card-header">
        <span className={isAvailable ? "status-pill status-pill-available" : "status-pill status-pill-coming-soon"}>
          {isAvailable ? "available" : "coming soon"}
        </span>
        <span className="node-group-label">{node.group}</span>
      </div>

      <FlowIcon kind={node.icon} />

      <div className="node-copy">
        <h2>{node.title}</h2>
        <p>{node.description}</p>
      </div>

      <div className="node-meta">
        <span>角色: {node.roles.join(" / ")}</span>
      </div>

      <button
        type="button"
        className={isAvailable ? "node-action" : "node-action node-action-disabled"}
        onClick={() => onSelect(node.key)}
        disabled={!isAvailable}
        aria-describedby={`${node.key}-note`}
      >
        {isAvailable ? "查看入口策略" : "Phase 2 保留"}
      </button>

      <p className="node-note" id={`${node.key}-note`}>
        {isAvailable ? "此節點可作為第一版主入口。" : "此節點僅保留流程辨識，不提供正式進入。"}
      </p>
    </article>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [selectedNodeKey, setSelectedNodeKey] = useState("intake");
  const [session, setSession] = useState<PortalSession | null>(null);
  const selectedNode = flowNodes.find((node) => node.key === selectedNodeKey) ?? flowNodes[0];

  useEffect(() => {
    const portalSession = readPortalSession();
    if (!portalSession) {
      router.replace("/login");
      return;
    }
    setSession(portalSession);
  }, [router]);

  function handleSignOut() {
    clearPortalSession();
    router.replace("/login");
  }

  if (!session) {
    return null;
  }

  return (
    <main className="portal-shell">
      <section className="surface-card flow-shell">
        <header className="flow-topbar">
          <div>
            <p className="eyebrow">Flow-Oriented Landing</p>
            <h1>Portal 入口地圖</h1>
            <p className="panel-copy">
              先讓使用者看懂今日營運主線，再把治理入口與未來節點分層呈現，不提早滑向 KPI dashboard。
            </p>
          </div>

          <div className="topbar-actions">
            <span className="topbar-badge">{session.roleCodes.join(" / ")}</span>
            <span className="topbar-badge topbar-badge-soft">{session.displayName}</span>
            <button className="button-secondary" type="button" onClick={handleSignOut}>
              清除 Session
            </button>
          </div>
        </header>

        <section className="role-strip" aria-label="role highlights">
          <span className="role-pill role-pill-active">生產: 當日扣帳 / 生產規劃 / 盤點調整</span>
          <span className="role-pill">會計: 需求匯入 / 當日扣帳 / 財務對帳</span>
          <span className="role-pill">主管: 主資料 / 生產規劃 / 報表分析</span>
        </section>

        <section className="flow-group">
          <div className="flow-group-heading">
            <div>
              <p className="eyebrow">Group A</p>
              <h2>今日營運主線</h2>
            </div>
            <p>這一組是 landing 的視覺中心，聚焦 Phase 1 最先承接的工作入口。</p>
          </div>
          <div className="node-grid node-grid-primary">
            {primaryNodes.map((node) => (
              <FlowNodeCard
                key={node.key}
                node={node}
                isSelected={selectedNode.key === node.key}
                onSelect={setSelectedNodeKey}
              />
            ))}
          </div>
        </section>

        <section className="flow-group flow-group-secondary">
          <div className="flow-group-heading">
            <div>
              <p className="eyebrow">Group B</p>
              <h2>治理與設定</h2>
            </div>
            <p>治理型入口留在第二層，不搶過主線，但仍維持清楚到達。</p>
          </div>
          <div className="node-grid node-grid-secondary">
            {governanceNodes.map((node) => (
              <FlowNodeCard
                key={node.key}
                node={node}
                isSelected={selectedNode.key === node.key}
                onSelect={setSelectedNodeKey}
              />
            ))}
          </div>
        </section>

        <section className="flow-group flow-group-future">
          <div className="flow-group-heading">
            <div>
              <p className="eyebrow">Group C</p>
              <h2>延伸流程與後續能力</h2>
            </div>
            <p>保留節點位置與語意，避免使用者誤認為第一版已完整覆蓋所有模組。</p>
          </div>
          <div className="node-grid node-grid-future">
            {futureNodes.map((node) => (
              <FlowNodeCard
                key={node.key}
                node={node}
                isSelected={selectedNode.key === node.key}
                onSelect={setSelectedNodeKey}
              />
            ))}
          </div>
        </section>

        <section className="detail-panel" id="entry-detail" aria-live="polite">
          <div>
            <p className="eyebrow">Selected Entry</p>
            <h2>{selectedNode.title}</h2>
            <p>{selectedNode.description}</p>
          </div>

          <dl className="detail-list">
            <div>
              <dt>預定導向</dt>
              <dd>{selectedNode.intendedPath}</dd>
            </div>
            <div>
              <dt>狀態</dt>
              <dd>{selectedNode.status}</dd>
            </div>
            <div>
              <dt>主要角色</dt>
              <dd>{selectedNode.roles.join(" / ")}</dd>
            </div>
          </dl>

          <p className="detail-note">{selectedNode.note}</p>

          {selectedNode.status === "available" && availableNodeHrefMap[selectedNode.key] ? (
            <Link className="button-primary detail-cta" href={availableNodeHrefMap[selectedNode.key] as string}>
              {selectedNode.key === "intake" ? "進入 Intake Workbench" : "進入 Daily Ops Workbench"}
            </Link>
          ) : null}
        </section>
      </section>
    </main>
  );
}
