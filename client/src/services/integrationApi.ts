type JsonRecord = Record<string, unknown>;

// Use Vite proxy for all API calls. The proxy is configured in vite.config.ts
// This ensures consistent routing and simplifies CORS handling.
const integrationPrefix = '/api/v1/integration';

function buildUrl(path: string): string {
  // Always use relative URLs to leverage Vite's proxy in dev mode
  // In production (built assets), these are absolute to the same origin
  return `${integrationPrefix}${path}`;
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
    body: JSON.stringify(state),
  });
}

export async function saveMaintenanceState(state: JsonRecord): Promise<JsonRecord> {
  return requestJson<JsonRecord>('/maintenance', {
    method: 'PUT',
    body: JSON.stringify(state),
  });
}

export async function fetchEmergencyContacts(): Promise<EmergencyContactPayload[]> {
  return requestJson<EmergencyContactPayload[]>('/emergency-contacts');
}

export async function createEmergencyContact(payload: EmergencyContactCreatePayload): Promise<EmergencyContactPayload> {
  return requestJson<EmergencyContactPayload>('/emergency-contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEmergencyContact(contactId: string, payload: EmergencyContactUpdatePayload): Promise<EmergencyContactPayload> {
  return requestJson<EmergencyContactPayload>(`/emergency-contacts/${encodeURIComponent(contactId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEmergencyContact(contactId: string): Promise<JsonRecord> {
  return requestJson<JsonRecord>(`/emergency-contacts/${encodeURIComponent(contactId)}`, {
    method: 'DELETE',
  });
}

export async function fetchMapMarkers(): Promise<MapMarkerPayload[]> {
  return requestJson<MapMarkerPayload[]>('/map-markers');
}

export async function createMapMarker(payload: MapMarkerCreatePayload): Promise<MapMarkerPayload> {
  return requestJson<MapMarkerPayload>('/map-markers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMapMarker(markerId: string, payload: MapMarkerUpdatePayload): Promise<MapMarkerPayload> {
  return requestJson<MapMarkerPayload>(`/map-markers/${encodeURIComponent(markerId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteMapMarker(markerId: string): Promise<JsonRecord> {
  return requestJson<JsonRecord>(`/map-markers/${encodeURIComponent(markerId)}`, {
    method: 'DELETE',
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