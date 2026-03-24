type JsonRecord = Record<string, unknown>;

// Use Vite proxy for all API calls. The proxy is configured in vite.config.ts
// This ensures consistent routing and simplifies CORS handling.
const integrationPrefix = '/api/v1/integration';

function buildUrl(path: string): string {
  // Always use relative URLs to leverage Vite's proxy in dev mode
  // In production (built assets), these are absolute to the same origin
  return `${integrationPrefix}${path}`;
}

/** Read JWT from localStorage and return auth headers if available. */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Integration API ${response.status}: ${text || response.statusText}`);
  }

  return (await response.json()) as T;
}

export interface BackendBootstrapState {
  adminControl: JsonRecord;
  maintenance: JsonRecord;
  reports: unknown[];
}

export type ReportAction = 'verify' | 'reject' | 'dispatch' | 'resolve';

export interface WeatherSnapshot {
  weather: {
    temperature: number;
    windSpeed: number;
    rainfall: number;
    weatherCode: number;
    time: string;
  };
  radarTileUrl: string | null;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface RealtimeEventEnvelope {
  event: string;
  payload: unknown;
  timestamp: number;
}

export type EmergencyContactType = 'police' | 'ambulance' | 'fire' | 'disaster' | 'custom';

export interface EmergencyContactPayload {
  id: string;
  label: string;
  number: string;
  type: EmergencyContactType;
  active: boolean;
}

export type EmergencyContactCreatePayload = Omit<EmergencyContactPayload, 'id'>;
export type EmergencyContactUpdatePayload = Partial<EmergencyContactCreatePayload>;

export type MapMarkerType = 'shelter' | 'hospital' | 'report' | 'infrastructure';

export interface MapMarkerPayload {
  id: string;
  label: string;
  markerType: MapMarkerType;
  position: [number, number];
  detail: string;
  visible: boolean;
}

export type MapMarkerCreatePayload = Omit<MapMarkerPayload, 'id'>;
export type MapMarkerUpdatePayload = Partial<MapMarkerCreatePayload>;

export async function fetchBootstrapState(): Promise<BackendBootstrapState> {
  return requestJson<BackendBootstrapState>('/bootstrap');
}

export async function saveAdminControlState(state: JsonRecord): Promise<JsonRecord> {
  return requestJson<JsonRecord>('/admin-control', {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(state),
  });
}

export async function saveMaintenanceState(state: JsonRecord): Promise<JsonRecord> {
  return requestJson<JsonRecord>('/maintenance', {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(state),
  });
}

export async function fetchEmergencyContacts(): Promise<EmergencyContactPayload[]> {
  return requestJson<EmergencyContactPayload[]>('/emergency-contacts');
}

export async function createEmergencyContact(payload: EmergencyContactCreatePayload): Promise<EmergencyContactPayload> {
  return requestJson<EmergencyContactPayload>('/emergency-contacts', {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function updateEmergencyContact(contactId: string, payload: EmergencyContactUpdatePayload): Promise<EmergencyContactPayload> {
  return requestJson<EmergencyContactPayload>(`/emergency-contacts/${encodeURIComponent(contactId)}`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function deleteEmergencyContact(contactId: string): Promise<JsonRecord> {
  return requestJson<JsonRecord>(`/emergency-contacts/${encodeURIComponent(contactId)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
}

export async function fetchMapMarkers(): Promise<MapMarkerPayload[]> {
  return requestJson<MapMarkerPayload[]>('/map-markers');
}

export async function createMapMarker(payload: MapMarkerCreatePayload): Promise<MapMarkerPayload> {
  return requestJson<MapMarkerPayload>('/map-markers', {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function updateMapMarker(markerId: string, payload: MapMarkerUpdatePayload): Promise<MapMarkerPayload> {
  return requestJson<MapMarkerPayload>(`/map-markers/${encodeURIComponent(markerId)}`, {
    method: 'PATCH',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function deleteMapMarker(markerId: string): Promise<JsonRecord> {
  return requestJson<JsonRecord>(`/map-markers/${encodeURIComponent(markerId)}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
}

export async function createReport(payload: JsonRecord): Promise<JsonRecord> {
  return requestJson<JsonRecord>('/reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function applyReportAction(reportId: string, action: ReportAction): Promise<JsonRecord> {
  return requestJson<JsonRecord>(`/reports/${encodeURIComponent(reportId)}/action`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify({ action }),
  });
}

export async function fetchWeatherSnapshot(lat: number, lon: number): Promise<WeatherSnapshot> {
  return requestJson<WeatherSnapshot>(`/weather/current?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`);
}

export interface ChatRequestPayload {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  knowledge?: Array<{ category: string; keywords: string[]; response: string }>;
}

export interface ChatResponsePayload {
  reply: string;
  source: 'ai' | 'fallback';
  model: string;
}

export async function sendChatMessage(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  return requestJson<ChatResponsePayload>('/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function openRealtimeStream(
  onMessage: (event: RealtimeEventEnvelope) => void,
  onError?: (event: Event) => void,
): EventSource {
  const es = new EventSource(buildUrl('/events'));

  es.onmessage = (evt) => {
    try {
      const parsed = JSON.parse(evt.data) as RealtimeEventEnvelope;
      onMessage(parsed);
    } catch {
      // ignore malformed payloads
    }
  };

  es.onerror = (evt) => {
    if (onError) onError(evt);
  };

  return es;
}

// ─── User Management API Functions ───
// These functions call the backend user management endpoints

export interface PaginatedUsersResponse {
  items: UserResponse[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  public_id: string;
  status: 'active' | 'suspended' | 'deleted' | 'pending';
  is_verified: boolean;
  trust_score: number;
  report_count: number;
  district_id?: string;
  preferred_language: string;
  mfa_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Activate a user account (set status to ACTIVE)
 * Requires admin privileges
 */
export async function activateUser(userId: string): Promise<UserResponse> {
  const response = await fetch(`/api/v1/users/${userId}/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to activate user: ${response.status} ${text || response.statusText}`);
  }

  return (await response.json()) as UserResponse;
}

/**
 * Suspend/deactivate a user account (set status to SUSPENDED)
 * Requires admin privileges
 */
export async function suspendUserApi(userId: string): Promise<UserResponse> {
  const response = await fetch(`/api/v1/users/${userId}/deactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to suspend user: ${response.status} ${text || response.statusText}`);
  }

  return (await response.json()) as UserResponse;
}

/**
 * Delete a user account (soft delete - sets status to DELETED, revokes tokens)
 * Requires super admin privileges
 */
export async function deleteUserApi(userId: string): Promise<{ message: string; success: boolean }> {
  const response = await fetch(`/api/v1/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to delete user: ${response.status} ${text || response.statusText}`);
  }

  return (await response.json()) as { message: string; success: boolean };
}

/**
 * Fetch paginated user list from the backend.
 * Requires admin privileges.
 */
export async function fetchUsers(
  page = 1,
  pageSize = 50,
  search?: string,
): Promise<PaginatedUsersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (search) params.set('search', search);

  const response = await fetch(`/api/v1/users?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch users: ${response.status} ${text || response.statusText}`);
  }

  return (await response.json()) as PaginatedUsersResponse;
}

// ─── Admin Config API Functions (Visibility, Settings, Maintenance) ───

export interface PageVisibilityPayload {
  page_name: string;
  is_enabled: boolean;
}

export async function fetchPageVisibility(): Promise<{ page_name: string; is_enabled: boolean }[]> {
  return requestJson<{ page_name: string; is_enabled: boolean }[]>('/admin/page-visibility');
}

export async function updatePageVisibility(page_name: string, is_enabled: boolean): Promise<{ page_name: string; is_enabled: boolean }> {
  return requestJson<{ page_name: string; is_enabled: boolean }>(`/admin/page-visibility/${encodeURIComponent(page_name)}`, {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify({ is_enabled }),
  });
}

export interface SystemSettingsPayload {
  dark_mode: boolean;
  sound_alerts: boolean;
  push_notifications: boolean;
  data_collection: boolean;
  anonymous_reporting: boolean;
}

export async function fetchSystemSettings(): Promise<SystemSettingsPayload> {
  return requestJson<SystemSettingsPayload>('/admin/settings');
}

export async function updateSystemSettings(payload: SystemSettingsPayload): Promise<SystemSettingsPayload> {
  return requestJson<SystemSettingsPayload>('/admin/settings', {
    method: 'PUT',
    headers: { ...getAuthHeaders() },
    body: JSON.stringify(payload),
  });
}

export async function syncDatabaseAction(): Promise<{ status: string; message: string }> {
  return requestJson<{ status: string; message: string }>('/admin/system/sync-db', { method: 'POST', headers: getAuthHeaders() });
}

export async function generateReportAction(): Promise<{ status: string; message: string }> {
  return requestJson<{ status: string; message: string }>('/admin/system/generate-report', { method: 'POST', headers: getAuthHeaders() });
}

export async function clearCacheAction(): Promise<{ status: string; message: string }> {
  return requestJson<{ status: string; message: string }>('/admin/system/clear-cache', { method: 'POST', headers: getAuthHeaders() });
}

export async function resetSystemAction(): Promise<{ status: string; message: string }> {
  return requestJson<{ status: string; message: string }>('/admin/system/reset', { method: 'POST', headers: getAuthHeaders() });
}