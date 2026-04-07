"use client";

import { startTransition, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  createPortalSession,
  getDefaultApiBaseUrl,
  type PortalRolePreset,
  writePortalSession,
} from "../../lib/portal-session";

type LoginFormState = {
  account: string;
  password: string;
  rolePreset: PortalRolePreset;
  apiBaseUrl: string;
};

const initialFormState: LoginFormState = {
  account: "",
  password: "",
  rolePreset: "accounting",
  apiBaseUrl: getDefaultApiBaseUrl(),
};

function wait(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function PortalMark() {
  return (
    <div className="portal-mark" aria-hidden="true">
      <div className="portal-mark-cube portal-mark-cube-primary" />
      <div className="portal-mark-cube portal-mark-cube-secondary" />
      <div className="portal-mark-ring" />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<LoginFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const trimmedAccount = formState.account.trim();
    const trimmedPassword = formState.password.trim();

    await wait(900);

    if (trimmedAccount.length < 3 || trimmedPassword.length < 6) {
      setFeedbackMessage(
        "請輸入完整帳號與密碼。此切片僅提供本地登入殼層，尚未接正式驗證流程。",
      );
      setIsSubmitting(false);
      return;
    }

    writePortalSession(
      createPortalSession({
        account: trimmedAccount,
        rolePreset: formState.rolePreset,
        apiBaseUrl: formState.apiBaseUrl,
      }),
    );

    startTransition(() => {
      router.push("/landing");
    });
  }

  return (
    <main className="portal-shell">
      <section className="surface-card login-shell">
        <div className="brand-panel">
          <div>
            <p className="eyebrow">Ivyhouse OP System</p>
            <h1>艾薇手工坊營運入口</h1>
            <p className="brand-lead">
              以流程為主線整理需求匯入、當日扣帳與後續營運模組，先讓登入與入口感穩定落地。
            </p>
          </div>

          <div className="brand-illustration">
            <PortalMark />
            <div className="brand-note-grid">
              <article className="brand-note">
                <span className="brand-note-label">需求節奏</span>
                <strong>每日批次進站</strong>
                <p>從需求匯入到排程與盤點，保留同一條工作脈絡。</p>
              </article>
              <article className="brand-note">
                <span className="brand-note-label">入口感</span>
                <strong>品牌化但不失焦</strong>
                <p>保留奶油白、暖金與深綠語言，同時讓表單與狀態清楚可掃描。</p>
              </article>
            </div>
          </div>

          <ul className="brand-bullets" aria-label="Portal login highlights">
            <li>明確標示本輪僅為前端殼層，不假裝已接正式登入。</li>
            <li>保留清楚錯誤回饋、鍵盤焦點與送出中狀態。</li>
            <li>登入後直接進入流程導向 landing shell。</li>
          </ul>
        </div>

        <div className="form-panel">
          <div className="panel-heading">
            <p className="eyebrow">Portal Access</p>
            <h2>登入工作台</h2>
            <p className="panel-copy">
              使用你的 Portal 識別資訊進入第一版入口頁。這裡目前只驗證本地 UI 狀態，不串接後端 session。
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="field-group" htmlFor="account">
              <span className="field-label">帳號</span>
              <input
                id="account"
                name="account"
                type="text"
                autoComplete="username"
                className="input-field"
                value={formState.account}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    account: event.target.value,
                  }));
                }}
                placeholder="請輸入 Portal 帳號"
                disabled={isSubmitting}
              />
            </label>

            <label className="field-group" htmlFor="password">
              <span className="field-label">密碼</span>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="input-field"
                value={formState.password}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    password: event.target.value,
                  }));
                }}
                placeholder="至少輸入 6 個字元"
                disabled={isSubmitting}
              />
            </label>

            <label className="field-group" htmlFor="rolePreset">
              <span className="field-label">角色預設</span>
              <select
                id="rolePreset"
                name="rolePreset"
                className="input-field"
                value={formState.rolePreset}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    rolePreset: event.target.value as PortalRolePreset,
                  }));
                }}
                disabled={isSubmitting}
              >
                <option value="accounting">會計 / 行政</option>
                <option value="operations">生產 / 包裝及出貨</option>
                <option value="supervisor">主管 / 管理員</option>
              </select>
            </label>

            <label className="field-group" htmlFor="apiBaseUrl">
              <span className="field-label">API Base URL</span>
              <input
                id="apiBaseUrl"
                name="apiBaseUrl"
                type="url"
                className="input-field"
                value={formState.apiBaseUrl}
                onChange={(event) => {
                  setFormState((currentState) => ({
                    ...currentState,
                    apiBaseUrl: event.target.value,
                  }));
                }}
                placeholder="http://localhost:3000/api"
                disabled={isSubmitting}
              />
            </label>

            <p className="helper-copy">
              這個切片會在本地建立 Portal session bridge，帶入 principal、role preset 與 API base URL，再導向 landing / workbench。
            </p>

            {feedbackMessage ? (
              <div className="status-banner status-banner-error" role="status" aria-live="polite">
                {feedbackMessage}
              </div>
            ) : null}

            <button className="button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "登入中..." : "進入 Portal"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
