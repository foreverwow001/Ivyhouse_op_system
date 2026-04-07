import { buildPortalHeaders, type PortalSession } from "./portal-session";

type PortalRequestOptions = {
  method?: string;
  body?: BodyInit | null;
  headers?: HeadersInit;
};

export class PortalApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "PortalApiError";
    this.status = status;
    this.details = details;
  }
}

export async function requestPortalJson<T>(
  session: PortalSession,
  path: string,
  options: PortalRequestOptions = {},
) {
  const headers = new Headers(options.headers);

  for (const [key, value] of Object.entries(buildPortalHeaders(session))) {
    headers.set(key, value);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${session.apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    body: options.body ?? null,
    headers,
    cache: "no-store",
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new PortalApiError(resolveErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}

async function readPayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function resolveErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (Array.isArray(message)) {
      return message.join("；");
    }
    if (typeof message === "string") {
      return message;
    }
  }

  return `Portal API request failed (${status})`;
}
