"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { PortalApiError, requestPortalJson } from "../../lib/portal-api";
import { readPortalSession, type PortalSession } from "../../lib/portal-session";

type DemandBatchResponse = {
  id: string;
  batchNo: string;
  businessDate: string;
  sourceType: string;
  status: string;
  lines?: Array<Record<string, unknown>>;
  deductionRuns?: Array<Record<string, unknown>>;
};

type ProductionPlanResponse = {
  id: string;
  status?: string;
  approvalStatus?: string;
  lines?: Array<Record<string, unknown>>;
};

type InventoryCountResponse = {
  id: string;
  status: string;
  lines?: Array<Record<string, unknown>>;
};

const focusToSectionId: Record<string, string> = {
  planning: "production-planning",
  "inventory-count": "inventory-count",
};

export default function DailyOpsWorkbenchPage() {
  const router = useRouter();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [focusView, setFocusView] = useState("");

  const [demandBatchId, setDemandBatchId] = useState("");
  const [demandBatch, setDemandBatch] = useState<DemandBatchResponse | null>(null);
  const [demandBatchForm, setDemandBatchForm] = useState({
    batchNo: `portal-${new Date().toISOString().slice(0, 10)}`,
    businessDate: new Date().toISOString().slice(0, 10),
    sourceType: "MANUAL_ENTRY",
    channelCode: "PORTAL",
    sellableSku: "SELLABLE-DEMO-001",
    sellableName: "Portal 測試品項",
    spec: "1 box",
    quantity: 12,
    rawSourceRef: "portal-daily-ops",
  });

  const [productionPlanId, setProductionPlanId] = useState("");
  const [productionPlanResult, setProductionPlanResult] = useState<Record<string, unknown> | null>(null);
  const [productionPlanForm, setProductionPlanForm] = useState({
    planDate: new Date().toISOString().slice(0, 10),
    planLevel: "SELLABLE",
    targetSku: "SELLABLE-DEMO-001",
    targetName: "Portal 測試品項",
    plannedQty: 8,
    uom: "box",
    approvalDecision: "APPROVED",
    approvalReason: "Portal supervisor review",
  });

  const [inventorySessionId, setInventorySessionId] = useState("");
  const [inventorySessionResult, setInventorySessionResult] = useState<Record<string, unknown> | null>(null);
  const [inventoryAlerts, setInventoryAlerts] = useState<{ negativeStock: unknown; reminders: unknown } | null>(null);
  const [inventoryForm, setInventoryForm] = useState({
    countScope: "DAILY_OPS",
    bucketType: "SELLABLE",
    itemSku: "SELLABLE-DEMO-001",
    beforeQty: 12,
    countedQty: 10,
    note: "Portal count sample",
    cancelReason: "Portal workbench sample cancellation",
  });

  useEffect(() => {
    const portalSession = readPortalSession();
    if (!portalSession) {
      router.replace("/login");
      return;
    }
    setSession(portalSession);
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const search = new URLSearchParams(window.location.search);
    setFocusView(search.get("view") ?? "");
  }, []);

  useEffect(() => {
    const focus = focusView;
    if (!focus) {
      return;
    }

    const targetId = focusToSectionId[focus];
    if (!targetId) {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [focusView]);

  async function handleCreateDemandBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const created = await requestPortalJson<DemandBatchResponse>(session, "/daily-ops/demand-batches", {
        method: "POST",
        body: JSON.stringify({
          batchNo: demandBatchForm.batchNo,
          businessDate: demandBatchForm.businessDate,
          sourceType: demandBatchForm.sourceType,
          importedBy: session.displayName,
          note: "由 Portal daily ops workbench 建立",
          lines: [
            {
              channelCode: demandBatchForm.channelCode,
              sellableSku: demandBatchForm.sellableSku,
              sellableName: demandBatchForm.sellableName,
              spec: demandBatchForm.spec,
              quantity: Number(demandBatchForm.quantity),
              rawSourceRef: demandBatchForm.rawSourceRef,
            },
          ],
        }),
      });

      setDemandBatch(created);
      setDemandBatchId(created.id);
      setFeedback(`已建立 demand batch：${created.id}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefreshDemandBatch() {
    if (!session || !demandBatchId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const batch = await requestPortalJson<DemandBatchResponse>(session, `/daily-ops/demand-batches/${demandBatchId.trim()}`);
      setDemandBatch(batch);
      setFeedback(`已讀取 demand batch：${batch.status}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirmDemandBatch() {
    if (!session || !demandBatchId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await requestPortalJson<Record<string, unknown>>(
        session,
        `/daily-ops/demand-batches/${demandBatchId.trim()}/confirm`,
        {
          method: "POST",
          body: JSON.stringify({ executedBy: session.displayName }),
        },
      );
      setDemandBatch(result as DemandBatchResponse);
      setFeedback("已確認 demand batch，正式扣帳 run 已建立。");
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateProductionPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const created = await requestPortalJson<ProductionPlanResponse>(session, "/daily-ops/production-plans", {
        method: "POST",
        body: JSON.stringify({
          planDate: productionPlanForm.planDate,
          createdBy: session.displayName,
          lines: [
            {
              planLevel: productionPlanForm.planLevel,
              targetSku: productionPlanForm.targetSku,
              targetName: productionPlanForm.targetName,
              plannedQty: Number(productionPlanForm.plannedQty),
              uom: productionPlanForm.uom,
            },
          ],
        }),
      });
      setProductionPlanResult(created as Record<string, unknown>);
      setProductionPlanId(created.id);
      setFeedback(`已建立 production plan：${created.id}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRerunBom() {
    if (!session || !productionPlanId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await requestPortalJson<Record<string, unknown>>(session, `/daily-ops/production-plans/${productionPlanId.trim()}/reserve-bom`, {
        method: "POST",
      });
      setProductionPlanResult(result);
      setFeedback("已送出 BOM rerun / reservation。若命中審核流程，請再送 approval decision。");
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePlanApproval() {
    if (!session || !productionPlanId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await requestPortalJson<Record<string, unknown>>(session, `/daily-ops/production-plans/${productionPlanId.trim()}/approval`, {
        method: "POST",
        body: JSON.stringify({
          decision: productionPlanForm.approvalDecision,
          reason: productionPlanForm.approvalReason,
        }),
      });
      setProductionPlanResult(result);
      setFeedback(`已送出 production plan approval：${productionPlanForm.approvalDecision}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateInventoryCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const created = await requestPortalJson<InventoryCountResponse>(session, "/daily-ops/inventory-counts", {
        method: "POST",
        body: JSON.stringify({
          countScope: inventoryForm.countScope,
          performedBy: session.displayName,
          lines: [
            {
              bucketType: inventoryForm.bucketType,
              itemSku: inventoryForm.itemSku,
              beforeQty: Number(inventoryForm.beforeQty),
              countedQty: Number(inventoryForm.countedQty),
              note: inventoryForm.note,
            },
          ],
        }),
      });
      setInventorySessionResult(created as Record<string, unknown>);
      setInventorySessionId(created.id);
      setFeedback(`已建立 inventory count session：${created.id}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCompleteInventoryCount() {
    if (!session || !inventorySessionId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await requestPortalJson<Record<string, unknown>>(session, `/daily-ops/inventory-counts/${inventorySessionId.trim()}/complete`, {
        method: "POST",
        body: JSON.stringify({ performedBy: session.displayName }),
      });
      setInventorySessionResult(result);
      setFeedback("已完成 inventory count session。");
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCancelInventoryCount() {
    if (!session || !inventorySessionId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await requestPortalJson<Record<string, unknown>>(session, `/daily-ops/inventory-counts/${inventorySessionId.trim()}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: inventoryForm.cancelReason }),
      });
      setInventorySessionResult(result);
      setFeedback("已取消 inventory count session。");
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefreshInventoryAlerts() {
    if (!session) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const [negativeStock, reminders] = await Promise.all([
        requestPortalJson<unknown>(session, "/daily-ops/inventory-alerts/negative-stock"),
        requestPortalJson<unknown>(session, "/daily-ops/inventory-alerts/count-reminder"),
      ]);
      setInventoryAlerts({ negativeStock, reminders });
      setFeedback("已更新 negative stock 與 count reminder alerts。");
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <main className="portal-shell">
      <section className="surface-card workbench-shell">
        <header className="workbench-header">
          <div>
            <p className="eyebrow">Slice 3</p>
            <h1>Daily Ops Workbench</h1>
            <p className="panel-copy">
              承接 demand batch、production planning、inventory count 與 alert surface，讓 Portal 從 intake 延伸到當日營運主線。
            </p>
          </div>

          <div className="topbar-actions">
            <span className="topbar-badge">{session.roleCodes.join(" / ")}</span>
            <Link className="button-secondary" href="/landing">
              返回入口地圖
            </Link>
          </div>
        </header>

        {feedback ? <div className="status-banner status-banner-info">{feedback}</div> : null}

        <div className="workbench-grid">
          <form className="workbench-card workbench-form" onSubmit={handleCreateDemandBatch}>
            <div className="workbench-card-heading">
              <p className="eyebrow">Demand Batch</p>
              <h2>建立 / 確認每日需求</h2>
            </div>

            <label className="field-group"><span className="field-label">Batch No</span><input className="input-field" value={demandBatchForm.batchNo} onChange={(event) => setDemandBatchForm((current) => ({ ...current, batchNo: event.target.value }))} /></label>
            <label className="field-group"><span className="field-label">Business Date</span><input className="input-field" type="date" value={demandBatchForm.businessDate} onChange={(event) => setDemandBatchForm((current) => ({ ...current, businessDate: event.target.value }))} /></label>
            <label className="field-group"><span className="field-label">Source Type</span><select className="input-field" value={demandBatchForm.sourceType} onChange={(event) => setDemandBatchForm((current) => ({ ...current, sourceType: event.target.value }))}><option value="MANUAL_ENTRY">MANUAL_ENTRY</option><option value="ORDER_IMPORT">ORDER_IMPORT</option></select></label>
            <label className="field-group"><span className="field-label">Sellable SKU</span><input className="input-field" value={demandBatchForm.sellableSku} onChange={(event) => setDemandBatchForm((current) => ({ ...current, sellableSku: event.target.value }))} /></label>
            <label className="field-group"><span className="field-label">Quantity</span><input className="input-field" type="number" min="1" value={demandBatchForm.quantity} onChange={(event) => setDemandBatchForm((current) => ({ ...current, quantity: Number(event.target.value) }))} /></label>

            <div className="action-row">
              <button className="button-primary" type="submit" disabled={isBusy}>建立 Demand Batch</button>
              <button className="button-secondary" type="button" onClick={handleRefreshDemandBatch} disabled={isBusy || !demandBatchId.trim()}>讀取 Batch</button>
              <button className="button-secondary" type="button" onClick={handleConfirmDemandBatch} disabled={isBusy || !demandBatchId.trim()}>Confirm Batch</button>
            </div>

            <label className="field-group"><span className="field-label">Demand Batch ID</span><input className="input-field" value={demandBatchId} onChange={(event) => setDemandBatchId(event.target.value)} /></label>

            <JsonPreview title="Demand Batch" data={demandBatch} />
          </form>

          <form className="workbench-card workbench-form" id="production-planning" onSubmit={handleCreateProductionPlan}>
            <div className="workbench-card-heading">
              <p className="eyebrow">Production Planning</p>
              <h2>排工 / BOM / Approval</h2>
            </div>

            <label className="field-group"><span className="field-label">Plan Date</span><input className="input-field" type="date" value={productionPlanForm.planDate} onChange={(event) => setProductionPlanForm((current) => ({ ...current, planDate: event.target.value }))} /></label>
            <label className="field-group"><span className="field-label">Plan Level</span><select className="input-field" value={productionPlanForm.planLevel} onChange={(event) => setProductionPlanForm((current) => ({ ...current, planLevel: event.target.value }))}><option value="SELLABLE">SELLABLE</option><option value="INNER_PACK">INNER_PACK</option></select></label>
            <label className="field-group"><span className="field-label">Target SKU</span><input className="input-field" value={productionPlanForm.targetSku} onChange={(event) => setProductionPlanForm((current) => ({ ...current, targetSku: event.target.value }))} /></label>
            <label className="field-group"><span className="field-label">Planned Qty</span><input className="input-field" type="number" min="1" value={productionPlanForm.plannedQty} onChange={(event) => setProductionPlanForm((current) => ({ ...current, plannedQty: Number(event.target.value) }))} /></label>
            <label className="field-group"><span className="field-label">Approval Decision</span><select className="input-field" value={productionPlanForm.approvalDecision} onChange={(event) => setProductionPlanForm((current) => ({ ...current, approvalDecision: event.target.value }))}><option value="APPROVED">APPROVED</option><option value="REJECTED">REJECTED</option></select></label>

            <div className="action-row">
              <button className="button-primary" type="submit" disabled={isBusy}>建立 Production Plan</button>
              <button className="button-secondary" type="button" onClick={handleRerunBom} disabled={isBusy || !productionPlanId.trim()}>Rerun BOM</button>
              <button className="button-secondary" type="button" onClick={handlePlanApproval} disabled={isBusy || !productionPlanId.trim()}>Approval Decision</button>
            </div>

            <label className="field-group"><span className="field-label">Production Plan ID</span><input className="input-field" value={productionPlanId} onChange={(event) => setProductionPlanId(event.target.value)} /></label>
            <JsonPreview title="Production Plan" data={productionPlanResult} />
          </form>

          <form className="workbench-card workbench-form" id="inventory-count" onSubmit={handleCreateInventoryCount}>
            <div className="workbench-card-heading">
              <p className="eyebrow">Inventory Count</p>
              <h2>盤點 Session / Alerts</h2>
            </div>

            <label className="field-group"><span className="field-label">Count Scope</span><select className="input-field" value={inventoryForm.countScope} onChange={(event) => setInventoryForm((current) => ({ ...current, countScope: event.target.value }))}><option value="DAILY_OPS">DAILY_OPS</option><option value="PACKAGING_MATERIAL">PACKAGING_MATERIAL</option><option value="SHIPPING_SUPPLY">SHIPPING_SUPPLY</option><option value="FULL_WAREHOUSE">FULL_WAREHOUSE</option></select></label>
            <label className="field-group"><span className="field-label">Bucket Type</span><select className="input-field" value={inventoryForm.bucketType} onChange={(event) => setInventoryForm((current) => ({ ...current, bucketType: event.target.value }))}><option value="SELLABLE">SELLABLE</option><option value="INNER_PACK_FINISHED">INNER_PACK_FINISHED</option><option value="PACKAGING_MATERIAL">PACKAGING_MATERIAL</option><option value="SHIPPING_SUPPLY_MANUAL">SHIPPING_SUPPLY_MANUAL</option></select></label>
            <label className="field-group"><span className="field-label">Item SKU</span><input className="input-field" value={inventoryForm.itemSku} onChange={(event) => setInventoryForm((current) => ({ ...current, itemSku: event.target.value }))} /></label>
            <label className="field-group"><span className="field-label">Counted Qty</span><input className="input-field" type="number" value={inventoryForm.countedQty} onChange={(event) => setInventoryForm((current) => ({ ...current, countedQty: Number(event.target.value) }))} /></label>

            <div className="action-row">
              <button className="button-primary" type="submit" disabled={isBusy}>建立 Count Session</button>
              <button className="button-secondary" type="button" onClick={handleCompleteInventoryCount} disabled={isBusy || !inventorySessionId.trim()}>Complete Session</button>
              <button className="button-secondary" type="button" onClick={handleCancelInventoryCount} disabled={isBusy || !inventorySessionId.trim()}>Cancel Session</button>
              <button className="button-secondary" type="button" onClick={handleRefreshInventoryAlerts} disabled={isBusy}>Refresh Alerts</button>
            </div>

            <label className="field-group"><span className="field-label">Inventory Session ID</span><input className="input-field" value={inventorySessionId} onChange={(event) => setInventorySessionId(event.target.value)} /></label>
            <JsonPreview title="Inventory Session" data={inventorySessionResult} />
          </form>
        </div>

        <section className="results-grid">
          <section className="workbench-card result-card">
            <div className="workbench-card-heading">
              <p className="eyebrow">Alerts</p>
              <h2>Negative Stock / Count Reminder</h2>
            </div>
            <JsonPreview title="Inventory Alerts" data={inventoryAlerts} />
          </section>
        </section>
      </section>
    </main>
  );
}

function JsonPreview({ title, data }: { title: string; data: unknown }) {
  if (!data) {
    return <p className="helper-copy">尚未載入 {title}。</p>;
  }

  return (
    <div className="json-preview">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof PortalApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "未知錯誤";
}
