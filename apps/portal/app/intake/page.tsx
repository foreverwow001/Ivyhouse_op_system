"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PortalApiError, requestPortalJson } from "../../lib/portal-api";
import { readPortalSession, type PortalSession } from "../../lib/portal-session";

type IntakeBatch = {
  intakeBatchId: string;
  status: string;
  intakeTarget: string;
  batchDate: string;
  sourceFileCount: number;
  parsedLineCount: number;
  unmappedCount: number;
  pendingReviewCount: number;
  primaryChannelCode: string;
};

type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

type SourceFileRecord = {
  sourceFileId: string;
  channelCode: string;
  originalFileName: string;
  status: string;
};

type CreateBatchForm = {
  intakeTarget: string;
  batchDate: string;
  primaryChannelCode: string;
  defaultDemandDate: string;
  note: string;
};

const initialCreateBatchForm: CreateBatchForm = {
  intakeTarget: "FORMAL_DEMAND",
  batchDate: new Date().toISOString().slice(0, 10),
  primaryChannelCode: "MOMO",
  defaultDemandDate: new Date().toISOString().slice(0, 10),
  note: "Portal intake workbench 建立",
};

const stageOrder = ["草稿", "解析中", "例外處理中", "待映射", "待人工確認", "已確認"];

export default function IntakeWorkbenchPage() {
  const router = useRouter();
  const [session, setSession] = useState<PortalSession | null>(null);
  const [batchForm, setBatchForm] = useState<CreateBatchForm>(initialCreateBatchForm);
  const [currentBatchId, setCurrentBatchId] = useState("");
  const [currentBatch, setCurrentBatch] = useState<IntakeBatch | null>(null);
  const [sourceFiles, setSourceFiles] = useState<SourceFileRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadChannelCode, setUploadChannelCode] = useState("MOMO");
  const [parseIdsInput, setParseIdsInput] = useState("");
  const [parsedLines, setParsedLines] = useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [mappingResults, setMappingResults] = useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [exceptions, setExceptions] = useState<PaginatedResult<Record<string, unknown>> | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const portalSession = readPortalSession();
    if (!portalSession) {
      router.replace("/login");
      return;
    }
    setSession(portalSession);
  }, [router]);

  async function handleCreateBatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const batch = await requestPortalJson<IntakeBatch>(session, "/intake/batches", {
        method: "POST",
        body: JSON.stringify({
          intakeTarget: batchForm.intakeTarget,
          batchDate: batchForm.batchDate,
          primaryChannelCode: batchForm.primaryChannelCode,
          defaultDemandDate: batchForm.defaultDemandDate || null,
          note: batchForm.note,
          createdBy: session.displayName,
        }),
      });

      setCurrentBatch(batch);
      setCurrentBatchId(batch.intakeBatchId);
      setSourceFiles([]);
      setParseIdsInput("");
      setParsedLines(null);
      setMappingResults(null);
      setExceptions(null);
      setFeedback(`已建立 intake batch：${batch.intakeBatchId}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefreshBatch() {
    if (!session || !currentBatchId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const batch = await requestPortalJson<IntakeBatch>(session, `/intake/batches/${currentBatchId.trim()}`);
      setCurrentBatch(batch);
      setFeedback(`已更新 batch 狀態：${batch.status}`);
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleUploadSourceFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !currentBatchId.trim() || !selectedFile) {
      setFeedback("請先建立或輸入 batchId，並選擇來源檔案。");
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("channelCode", uploadChannelCode);
    formData.append("intakeTarget", batchForm.intakeTarget);
    formData.append("uploadedBy", session.displayName);

    try {
      const uploaded = await requestPortalJson<SourceFileRecord>(
        session,
        `/intake/batches/${currentBatchId.trim()}/source-files`,
        { method: "POST", body: formData },
      );

      const nextSourceFiles = [...sourceFiles, uploaded];
      setSourceFiles(nextSourceFiles);
      setParseIdsInput(nextSourceFiles.map((item) => item.sourceFileId).join("\n"));
      setSelectedFile(null);
      setFeedback(`已上傳來源檔：${uploaded.originalFileName}`);
      await handleRefreshBatch();
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleTriggerParse() {
    if (!session || !currentBatchId.trim()) {
      return;
    }

    const sourceFileIds = parseIdsInput
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (sourceFileIds.length === 0) {
      setFeedback("請提供至少一個 sourceFileId 才能觸發解析。");
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      const result = await requestPortalJson<{ status: string; parsedLineCount: number }>(
        session,
        `/intake/batches/${currentBatchId.trim()}/parse`,
        {
          method: "POST",
          body: JSON.stringify({
            sourceFileIds,
            forceReparse: false,
            triggeredBy: session.displayName,
          }),
        },
      );
      setFeedback(`已觸發解析，目前狀態：${result.status}，解析筆數：${result.parsedLineCount}`);
      await handleRefreshBatch();
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function loadReviewStage(kind: "parsed-lines" | "mapping-results" | "exceptions") {
    if (!session || !currentBatchId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      if (kind === "parsed-lines") {
        const result = await requestPortalJson<PaginatedResult<Record<string, unknown>>>(
          session,
          `/intake/batches/${currentBatchId.trim()}/parsed-lines?page=1&pageSize=20`,
        );
        setParsedLines(result);
        setFeedback(`已載入 parsed lines：${result.total} 筆`);
      }

      if (kind === "mapping-results") {
        const result = await requestPortalJson<PaginatedResult<Record<string, unknown>>>(
          session,
          `/intake/batches/${currentBatchId.trim()}/mapping-results?page=1&pageSize=20`,
        );
        setMappingResults(result);
        setFeedback(`已載入 mapping results：${result.total} 筆`);
      }

      if (kind === "exceptions") {
        const result = await requestPortalJson<PaginatedResult<Record<string, unknown>>>(
          session,
          `/intake/batches/${currentBatchId.trim()}/exceptions`,
        );
        setExceptions(result);
        setFeedback(`已載入 exceptions：${result.total} 筆`);
      }
    } catch (error) {
      setFeedback(resolveErrorMessage(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConfirmBatch() {
    if (!session || !currentBatchId.trim()) {
      return;
    }

    setIsBusy(true);
    setFeedback(null);

    try {
      await requestPortalJson<Record<string, unknown>>(session, `/intake/batches/${currentBatchId.trim()}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          confirmationNote: "由 Portal intake workbench 送出確認",
          expectedExceptionCount: exceptions?.total ?? currentBatch?.unmappedCount ?? 0,
          confirmedBy: session.displayName,
        }),
      });
      setFeedback("已送出 batch confirm。若批次仍有未解例外，請回頭檢查 review stage。");
      await handleRefreshBatch();
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
            <p className="eyebrow">Slice 2</p>
            <h1>Intake Workbench</h1>
            <p className="panel-copy">
              以現有 Portal session bridge 承接 intake 主線，集中建立 batch、上傳來源檔、觸發解析、檢視 mapping / exception 狀態，並保留 confirm 前的 review 導流。
            </p>
          </div>

          <div className="topbar-actions">
            <span className="topbar-badge">{session.roleCodes.join(" / ")}</span>
            <Link className="button-secondary" href="/landing">
              返回入口地圖
            </Link>
          </div>
        </header>

        <section className="session-summary">
          <div className="session-summary-card">
            <span className="session-summary-label">Principal</span>
            <strong>{session.displayName}</strong>
            <p>{session.principalId}</p>
          </div>
          <div className="session-summary-card">
            <span className="session-summary-label">Session Bridge</span>
            <strong>{session.authSource}</strong>
            <p>{session.sessionId}</p>
          </div>
          <div className="session-summary-card">
            <span className="session-summary-label">API Base</span>
            <strong>{session.apiBaseUrl}</strong>
            <p>目前用 header bridge 對齊後端 Portal principal。</p>
          </div>
        </section>

        <section className="stage-strip" aria-label="intake stage strip">
          {stageOrder.map((stage) => {
            const isActive = currentBatch?.status === stage;
            const isReached = currentBatch ? stageOrder.indexOf(stage) <= stageOrder.indexOf(currentBatch.status) : stage === "DRAFT";
            return (
              <div key={stage} className={["stage-pill", isReached ? "stage-pill-reached" : "", isActive ? "stage-pill-active" : ""].join(" ")}>
                {stage}
              </div>
            );
          })}
        </section>

        {feedback ? <div className="status-banner status-banner-info">{feedback}</div> : null}

        <div className="workbench-grid">
          <form className="workbench-card workbench-form" onSubmit={handleCreateBatch}>
            <div className="workbench-card-heading">
              <p className="eyebrow">Create</p>
              <h2>建立 Intake Batch</h2>
            </div>

            <label className="field-group">
              <span className="field-label">Intake Target</span>
              <select className="input-field" value={batchForm.intakeTarget} onChange={(event) => setBatchForm((current) => ({ ...current, intakeTarget: event.target.value }))}>
                <option value="FORMAL_DEMAND">FORMAL_DEMAND</option>
                <option value="PEAK_PLANNING">PEAK_PLANNING</option>
              </select>
            </label>

            <label className="field-group">
              <span className="field-label">Batch Date</span>
              <input className="input-field" type="date" value={batchForm.batchDate} onChange={(event) => setBatchForm((current) => ({ ...current, batchDate: event.target.value }))} />
            </label>

            <label className="field-group">
              <span className="field-label">Primary Channel</span>
              <select className="input-field" value={batchForm.primaryChannelCode} onChange={(event) => setBatchForm((current) => ({ ...current, primaryChannelCode: event.target.value }))}>
                <option value="MOMO">MOMO</option>
                <option value="SHOPEE">SHOPEE</option>
                <option value="ORANGEPOINT">ORANGEPOINT</option>
                <option value="OFFICIAL">OFFICIAL</option>
              </select>
            </label>

            <label className="field-group">
              <span className="field-label">Default Demand Date</span>
              <input className="input-field" type="date" value={batchForm.defaultDemandDate} onChange={(event) => setBatchForm((current) => ({ ...current, defaultDemandDate: event.target.value }))} />
            </label>

            <label className="field-group">
              <span className="field-label">Note</span>
              <textarea className="input-field textarea-field" value={batchForm.note} onChange={(event) => setBatchForm((current) => ({ ...current, note: event.target.value }))} />
            </label>

            <button className="button-primary" type="submit" disabled={isBusy}>建立 Batch</button>
          </form>

          <section className="workbench-card">
            <div className="workbench-card-heading">
              <p className="eyebrow">Batch Detail</p>
              <h2>目前工作批次</h2>
            </div>

            <label className="field-group">
              <span className="field-label">Current Batch ID</span>
              <input className="input-field" value={currentBatchId} onChange={(event) => setCurrentBatchId(event.target.value)} placeholder="建立 batch 後會自動帶入，也可手動貼上既有 ID" />
            </label>

            <button className="button-secondary" type="button" onClick={handleRefreshBatch} disabled={isBusy || !currentBatchId.trim()}>
              重新讀取 Batch 摘要
            </button>

            {currentBatch ? (
              <dl className="detail-list detail-list-compact">
                <div><dt>Status</dt><dd>{currentBatch.status}</dd></div>
                <div><dt>Batch Date</dt><dd>{currentBatch.batchDate}</dd></div>
                <div><dt>Source Files</dt><dd>{currentBatch.sourceFileCount}</dd></div>
                <div><dt>Parsed Lines</dt><dd>{currentBatch.parsedLineCount}</dd></div>
                <div><dt>Unmapped</dt><dd>{currentBatch.unmappedCount}</dd></div>
                <div><dt>Pending Review</dt><dd>{currentBatch.pendingReviewCount}</dd></div>
              </dl>
            ) : (
              <p className="helper-copy">尚未載入任何 batch。先建立 batch，或貼入既有 batchId 後重新讀取。</p>
            )}
          </section>

          <form className="workbench-card workbench-form" onSubmit={handleUploadSourceFile}>
            <div className="workbench-card-heading">
              <p className="eyebrow">Upload</p>
              <h2>上傳來源檔</h2>
            </div>

            <label className="field-group">
              <span className="field-label">Channel Code</span>
              <select className="input-field" value={uploadChannelCode} onChange={(event) => setUploadChannelCode(event.target.value)}>
                <option value="MOMO">MOMO</option>
                <option value="SHOPEE">SHOPEE</option>
                <option value="ORANGEPOINT">ORANGEPOINT</option>
                <option value="OFFICIAL">OFFICIAL</option>
              </select>
            </label>

            <label className="field-group">
              <span className="field-label">Source File</span>
              <input className="input-field" type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
            </label>

            <button className="button-primary" type="submit" disabled={isBusy || !currentBatchId.trim() || !selectedFile}>
              上傳來源檔
            </button>

            {sourceFiles.length > 0 ? (
              <ul className="record-list">
                {sourceFiles.map((item) => (
                  <li key={item.sourceFileId}>
                    <strong>{item.originalFileName}</strong>
                    <span>{item.channelCode}</span>
                    <code>{item.sourceFileId}</code>
                  </li>
                ))}
              </ul>
            ) : null}
          </form>

          <section className="workbench-card workbench-form">
            <div className="workbench-card-heading">
              <p className="eyebrow">Review Stage</p>
              <h2>解析與覆核導流</h2>
            </div>

            <label className="field-group">
              <span className="field-label">Source File IDs</span>
              <textarea className="input-field textarea-field" value={parseIdsInput} onChange={(event) => setParseIdsInput(event.target.value)} placeholder="每行一個 sourceFileId，或貼上由 upload 區帶出的值" />
            </label>

            <div className="action-row">
              <button className="button-primary" type="button" onClick={handleTriggerParse} disabled={isBusy || !currentBatchId.trim()}>
                觸發 Parse
              </button>
              <button className="button-secondary" type="button" onClick={() => loadReviewStage("parsed-lines")} disabled={isBusy || !currentBatchId.trim()}>
                Parsed Lines
              </button>
              <button className="button-secondary" type="button" onClick={() => loadReviewStage("mapping-results")} disabled={isBusy || !currentBatchId.trim()}>
                Mapping Results
              </button>
              <button className="button-secondary" type="button" onClick={() => loadReviewStage("exceptions")} disabled={isBusy || !currentBatchId.trim()}>
                Exceptions
              </button>
            </div>

            <button className="button-secondary" type="button" onClick={handleConfirmBatch} disabled={isBusy || !currentBatchId.trim()}>
              送出 Confirm
            </button>
          </section>
        </div>

        <section className="results-grid">
          <ResultCard title="Parsed Lines" result={parsedLines} />
          <ResultCard title="Mapping Results" result={mappingResults} />
          <ResultCard title="Exceptions" result={exceptions} />
        </section>
      </section>
    </main>
  );
}

function ResultCard({ title, result }: { title: string; result: PaginatedResult<Record<string, unknown>> | null }) {
  return (
    <section className="workbench-card result-card">
      <div className="workbench-card-heading">
        <p className="eyebrow">{title}</p>
        <h2>{title}</h2>
      </div>

      {!result ? (
        <p className="helper-copy">尚未載入 {title}。</p>
      ) : result.items.length === 0 ? (
        <p className="helper-copy">{title} 目前沒有資料。</p>
      ) : (
        <ul className="record-list">
          {result.items.map((item, index) => (
            <li key={`${title}-${index}`}>
              <pre>{JSON.stringify(item, null, 2)}</pre>
            </li>
          ))}
        </ul>
      )}
    </section>
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
