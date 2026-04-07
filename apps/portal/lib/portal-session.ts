export type PortalRolePreset = "accounting" | "operations" | "supervisor";

export type PortalSession = {
  principalId: string;
  displayName: string;
  roleCodes: string[];
  sessionId: string;
  authSource: string;
  apiBaseUrl: string;
  createdAt: string;
};

export type CreatePortalSessionInput = {
  account: string;
  displayName?: string;
  rolePreset: PortalRolePreset;
  apiBaseUrl: string;
};

const portalSessionStorageKey = "ivyhouse.portal.session";

const rolePresetMap: Record<PortalRolePreset, string[]> = {
  accounting: ["會計", "行政"],
  operations: ["生產", "包裝及出貨"],
  supervisor: ["主管", "管理員"],
};

export function getDefaultApiBaseUrl() {
  return process.env.NEXT_PUBLIC_PORTAL_API_BASE_URL?.trim() || "http://localhost:3000/api";
}

export function createPortalSession(input: CreatePortalSessionInput): PortalSession {
  const principalId = input.account.trim();
  const normalizedApiBaseUrl = normalizeApiBaseUrl(input.apiBaseUrl);

  return {
    principalId,
    displayName: input.displayName?.trim() || principalId,
    roleCodes: rolePresetMap[input.rolePreset],
    sessionId: buildSessionId(),
    authSource: "PORTAL_SHELL",
    apiBaseUrl: normalizedApiBaseUrl,
    createdAt: new Date().toISOString(),
  };
}

export function readPortalSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(portalSessionStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PortalSession>;
    if (
      typeof parsed.principalId !== "string" ||
      typeof parsed.displayName !== "string" ||
      !Array.isArray(parsed.roleCodes) ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.authSource !== "string" ||
      typeof parsed.apiBaseUrl !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    return {
      principalId: parsed.principalId,
      displayName: parsed.displayName,
      roleCodes: parsed.roleCodes.filter((value): value is string => typeof value === "string"),
      sessionId: parsed.sessionId,
      authSource: parsed.authSource,
      apiBaseUrl: normalizeApiBaseUrl(parsed.apiBaseUrl),
      createdAt: parsed.createdAt,
    } satisfies PortalSession;
  } catch {
    return null;
  }
}

export function writePortalSession(session: PortalSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(portalSessionStorageKey, JSON.stringify(session));
}

export function clearPortalSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(portalSessionStorageKey);
}

export function buildPortalHeaders(session: PortalSession) {
  return {
    "x-portal-principal-id": session.principalId,
    "x-portal-display-name": session.displayName,
    "x-portal-role-codes": session.roleCodes.join(","),
    "x-portal-session-id": session.sessionId,
    "x-portal-auth-source": session.authSource,
  };
}

export function normalizeApiBaseUrl(apiBaseUrl: string) {
  return apiBaseUrl.trim().replace(/\/+$/, "");
}

function buildSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `portal-shell-${Date.now()}`;
}
