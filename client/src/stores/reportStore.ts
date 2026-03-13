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

// Seed data — realistic Sri Lankan flood reports
const SEED_REPORTS: FloodReport[] = [
  {
    report_id: 'RPT-SEED-001',
    user_id: '#8492',
    trust_score: 92,
    severity_level: 'CRITICAL',
    description: 'Water level has risen significantly in the last 30 minutes. The road is completely blocked. We are moving to the second floor.',
    location_name: 'Kelaniya, Gampaha',
    latitude: 6.9533,
    longitude: 79.9220,
    timestamp: Date.now() - 2 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-002',
    user_id: '#3217',
    trust_score: 87,
    severity_level: 'CRITICAL',
    description: 'Bridge near the temple is submerged. Vehicles stranded. Need immediate rescue boats.',
    location_name: 'Kaduwela, Colombo',
    latitude: 6.9310,
    longitude: 79.9830,
    timestamp: Date.now() - 5 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-003',
    user_id: '#5641',
    trust_score: 78,
    severity_level: 'HIGH',
    description: 'Paddy fields completely flooded. Water approaching residential area from the east side.',
    location_name: 'Biyagama, Gampaha',
    latitude: 6.9692,
    longitude: 79.9820,
    timestamp: Date.now() - 8 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-004',
    user_id: '#7823',
    trust_score: 95,
    severity_level: 'CRITICAL',
    description: 'Flood water entering homes, need rescue. Children and elderly trapped on upper floor.',
    location_name: 'Hanwella, Colombo',
    latitude: 6.9010,
    longitude: 80.0852,
    timestamp: Date.now() - 3 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-005',
    user_id: '#2094',
    trust_score: 81,
    severity_level: 'MEDIUM',
    description: 'Drainage canal overflowing. Water on main road about 1 foot deep and rising slowly.',
    location_name: 'Wellampitiya, Colombo',
    latitude: 6.9410,
    longitude: 79.8980,
    timestamp: Date.now() - 12 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-006',
    user_id: '#4456',
    trust_score: 88,
    severity_level: 'MEDIUM',
    description: 'Minor flooding on side roads. Traffic blocked near the market area.',
    location_name: 'Kolonnawa, Colombo',
    latitude: 6.9260,
    longitude: 79.8870,
    timestamp: Date.now() - 15 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-007',
    user_id: '#6190',
    trust_score: 74,
    severity_level: 'LOW',
    description: 'Slight waterlogging at junction. Drains seem blocked. Not critical yet.',
    location_name: 'Battaramulla, Colombo',
    latitude: 6.9000,
    longitude: 79.9180,
    timestamp: Date.now() - 22 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-008',
    user_id: '#9312',
    trust_score: 90,
    severity_level: 'CRITICAL',
    description: 'Kelani River breached embankment. Water flowing into residential zone rapidly.',
    location_name: 'Kaduwela, Colombo',
    latitude: 6.9350,
    longitude: 79.9790,
    timestamp: Date.now() - 1 * 60 * 1000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: '',
  },
  {
    report_id: 'RPT-SEED-009',
    user_id: '#1147',
    trust_score: 93,
    severity_level: 'HIGH',
    description: 'Heavy flooding on Avissawella Road. Multiple vehicles stranded, water still rising.',
    location_name: 'Avissawella, Colombo',
    latitude: 6.9530,
    longitude: 80.2210,
    timestamp: Date.now() - 45 * 60 * 1000,
    media_url: null,
    status: 'verified',
    admin_verification: { verified_by: 'CMD. PERERA', verified_time: Date.now() - 40 * 60 * 1000, response_team_status: 'dispatched' },
    emergency_response_status: 'Emergency team dispatched to this location.',
  },
  {
    report_id: 'RPT-SEED-010',
    user_id: '#6820',
    trust_score: 88,
    severity_level: 'CRITICAL',
    description: 'Kelani River overflow near Malwana. Residents evacuating to temple.',
    location_name: 'Malwana, Gampaha',
    latitude: 6.9780,
    longitude: 80.0330,
    timestamp: Date.now() - 60 * 60 * 1000,
    media_url: null,
    status: 'response_dispatched',
    admin_verification: { verified_by: 'CMD. PERERA', verified_time: Date.now() - 55 * 60 * 1000, response_team_status: 'on_site' },
    emergency_response_status: 'Emergency team on site. Rescue operations underway.',
  },
];

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
