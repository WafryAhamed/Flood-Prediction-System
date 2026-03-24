import { create } from 'zustand';
import { applyReportAction, createReport } from '../services/integrationApi';

export interface AdminVerification {
  verified_by: string;
  verified_time: number;
  response_team_status: 'none' | 'dispatched' | 'on_site' | 'completed';
}

export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'response_dispatched' | 'resolved';

export interface FloodReport {
  report_id: string;
  user_id: string;
  trust_score: number;
  severity_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  media_url: string | null;
  status: ReportStatus;
  admin_verification: AdminVerification | null;
  emergency_response_status: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function sortReports(reports: FloodReport[]): FloodReport[] {
  return [...reports].sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[a.severity_level] - SEVERITY_ORDER[b.severity_level];
    if (sevDiff !== 0) return sevDiff;
    return b.timestamp - a.timestamp;
  });
}

function normalizeReport(input: unknown): FloodReport | null {
  if (!input || typeof input !== 'object') return null;
  const candidate = input as Partial<FloodReport> & Record<string, unknown>;

  const status = (candidate.status as ReportStatus) || 'pending';
  const severity = (candidate.severity_level as FloodReport['severity_level']) || 'MEDIUM';

  if (!candidate.report_id || !candidate.location_name || typeof candidate.latitude !== 'number' || typeof candidate.longitude !== 'number') {
    return null;
  }

  return {
    report_id: String(candidate.report_id),
    user_id: String(candidate.user_id || '#0000'),
    trust_score: Number(candidate.trust_score ?? 75),
    severity_level: severity,
    description: String(candidate.description || ''),
    location_name: String(candidate.location_name),
    latitude: Number(candidate.latitude),
    longitude: Number(candidate.longitude),
    timestamp: Number(candidate.timestamp ?? Date.now()),
    media_url: (candidate.media_url as string | null | undefined) ?? null,
    status,
    admin_verification: (candidate.admin_verification as AdminVerification | null | undefined) ?? null,
    emergency_response_status: String(candidate.emergency_response_status || ''),
  };
}

interface ReportStore {
  reports: FloodReport[];
  hydrateReports: (reports: unknown[]) => void;
  /** Insert a new report or update an existing one in-place (used by SSE events). */
  upsertReport: (report: unknown) => void;
  addReport: (report: Omit<FloodReport, 'report_id' | 'status' | 'timestamp' | 'user_id' | 'trust_score' | 'admin_verification' | 'emergency_response_status'>) => void;
  verifyReport: (reportId: string) => void;
  rejectReport: (reportId: string) => void;
  dispatchHelp: (reportId: string) => void;
  resolveReport: (reportId: string) => void;
  getPendingReports: () => FloodReport[];
  getVerifiedReports: () => FloodReport[];
  getPublicReports: () => FloodReport[];
}

let nextId = 100;

function generateId(): string {
  return `RPT-${Date.now()}-${nextId++}`;
}

function generateUserId(): string {
  return `#${Math.floor(1000 + Math.random() * 9000)}`;
}

function generateTrustScore(): number {
  return Math.floor(70 + Math.random() * 28);
}

// Seed data — Populated from backend bootstrap
const SEED_REPORTS: FloodReport[] = [];

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: SEED_REPORTS,

  hydrateReports: (incoming) => {
    const normalized = incoming
      .map((item) => normalizeReport(item))
      .filter((item): item is FloodReport => item !== null);
    if (normalized.length > 0) {
      set({ reports: sortReports(normalized) });
    }
  },

  upsertReport: (report) => {
    const normalized = normalizeReport(report);
    if (!normalized) return;
    set((state) => {
      const exists = state.reports.some((r) => r.report_id === normalized.report_id);
      if (exists) {
        return {
          reports: sortReports(
            state.reports.map((r) =>
              r.report_id === normalized.report_id ? normalized : r
            )
          ),
        };
      }
      return {
        reports: sortReports([normalized, ...state.reports]).slice(0, 200),
      };
    });
  },

  addReport: (partial) => {
    void createReport({
      severity_level: partial.severity_level,
      description: partial.description,
      location_name: partial.location_name,
      latitude: partial.latitude,
      longitude: partial.longitude,
      media_url: partial.media_url,
    })
      .then((serverReport) => {
        const normalized = normalizeReport(serverReport);
        if (!normalized) throw new Error('Invalid report payload from backend');
        set((state) => ({
          reports: sortReports([
            normalized,
            ...state.reports.filter((r) => r.report_id !== normalized.report_id),
          ]).slice(0, 200),
        }));
      })
      .catch(() => {
        const fallback: FloodReport = {
          ...partial,
          report_id: generateId(),
          user_id: generateUserId(),
          trust_score: generateTrustScore(),
          timestamp: Date.now(),
          status: 'pending',
          admin_verification: null,
          emergency_response_status: '',
        };
        set((state) => ({
          reports: [fallback, ...state.reports].slice(0, 200),
        }));
      });
  },

  verifyReport: (reportId) => {
    void applyReportAction(reportId, 'verify').then((serverReport) => {
      const normalized = normalizeReport(serverReport);
      if (!normalized) return;
      set((state) => ({
        reports: state.reports.map((r) => (r.report_id === reportId ? normalized : r)),
      }));
    });
  },

  rejectReport: (reportId) => {
    void applyReportAction(reportId, 'reject').then((serverReport) => {
      const normalized = normalizeReport(serverReport);
      if (!normalized) return;
      set((state) => ({
        reports: state.reports.map((r) => (r.report_id === reportId ? normalized : r)),
      }));
    });
  },

  dispatchHelp: (reportId) => {
    void applyReportAction(reportId, 'dispatch').then((serverReport) => {
      const normalized = normalizeReport(serverReport);
      if (!normalized) return;
      set((state) => ({
        reports: state.reports.map((r) => (r.report_id === reportId ? normalized : r)),
      }));
    });
  },

  resolveReport: (reportId) => {
    void applyReportAction(reportId, 'resolve').then((serverReport) => {
      const normalized = normalizeReport(serverReport);
      if (!normalized) return;
      set((state) => ({
        reports: state.reports.map((r) => (r.report_id === reportId ? normalized : r)),
      }));
    });
  },

  getPendingReports: () => {
    return sortReports(get().reports.filter((r) => r.status === 'pending'));
  },

  getVerifiedReports: () => {
    return sortReports(get().reports.filter((r) => r.status === 'verified' || r.status === 'response_dispatched'));
  },

  getPublicReports: () => {
    return sortReports(get().reports.filter((r) => r.status === 'verified' || r.status === 'response_dispatched' || r.status === 'resolved'));
  },
}));
