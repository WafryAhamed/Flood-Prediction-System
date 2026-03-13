type JsonRecord = Record<string, unknown>;

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const rawBackendUrl = (env.VITE_BACKEND_URL || '').trim();
const backendBase = rawBackendUrl ? rawBackendUrl.replace(/\/+$/, '') : '';
const integrationPrefix = '/api/v1/integration';

function buildUrl(path: string): string {
  return `${backendBase}${integrationPrefix}${path}`;
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
