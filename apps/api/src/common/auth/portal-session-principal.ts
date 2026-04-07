export interface PortalSessionPrincipal {
  principalId: string;
  displayName: string;
  roleCodes: string[];
  sessionId: string;
  authSource: string;
}

export interface RequestWithPortalSessionPrincipal {
  portalPrincipal?: PortalSessionPrincipal;
}

type HeaderValue = string | string[] | undefined;

export function resolvePortalSessionPrincipal(
  headers: Record<string, HeaderValue>,
  options?: {
    roleAliases?: Record<string, string>;
    roleNormalization?: Record<string, string>;
  },
): PortalSessionPrincipal | null {
  const principalId = readRequiredHeader(headers, 'x-portal-principal-id');
  const sessionId = readRequiredHeader(headers, 'x-portal-session-id');
  const roleCodes = readRoleCodes(headers['x-portal-role-codes'], options);

  if (!principalId || !sessionId || roleCodes.length === 0) {
    return null;
  }

  return {
    principalId,
    displayName: readOptionalHeader(headers, 'x-portal-display-name') ?? principalId,
    roleCodes,
    sessionId,
    authSource: readOptionalHeader(headers, 'x-portal-auth-source') ?? 'PORTAL_SESSION',
  };
}

export function hasPortalRole(principal: PortalSessionPrincipal, expectedRole: string) {
  return principal.roleCodes.includes(expectedRole);
}

function readRoleCodes(
  value: HeaderValue,
  options?: {
    roleAliases?: Record<string, string>;
    roleNormalization?: Record<string, string>;
  },
) {
  const roleAliases = options?.roleAliases ?? {};
  const roleNormalization = options?.roleNormalization ?? {};

  return normalizeHeaderValues(value)
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => roleAliases[item.toLowerCase()] ?? item)
    .map((item) => roleNormalization[item] ?? item);
}

function readRequiredHeader(headers: Record<string, HeaderValue>, headerName: string) {
  return readOptionalHeader(headers, headerName)?.trim() || null;
}

function readOptionalHeader(headers: Record<string, HeaderValue>, headerName: string) {
  return normalizeHeaderValues(headers[headerName])[0] ?? null;
}

function normalizeHeaderValues(value: HeaderValue) {
  return (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );
}