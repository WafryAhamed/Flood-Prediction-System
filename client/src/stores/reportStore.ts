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
const SEED_REPORTS: FloodReport[] = [
  {
    report_id: 'RPT-20260418-001',
    user_id: '#3847',
    trust_score: 92,
    severity_level: 'CRITICAL',
    description: 'Water entering homes on Galle Face Green. Families trapped on roofs. Immediate rescue needed.',
    location_name: 'Galle Face Green, Colombo',
    latitude: 6.9313,
    longitude: 80.7628,
    timestamp: Date.now() - 8 * 60000,
    media_url: 'https://example.com/flood1.jpg',
    status: 'verified',
    admin_verification: {
      verified_by: 'admin-001',
      verified_time: Date.now() - 5 * 60000,
      response_team_status: 'on_site',
    },
    emergency_response_status: 'Rescue teams dispatched. 8 people evacuated.',
  },
  {
    report_id: 'RPT-20260418-002',
    user_id: '#5621',
    trust_score: 85,
    severity_level: 'HIGH',
    description: 'Road blocked by landslide debris. Traffic stopped. Kandy-Nuwara Eliya road impassable.',
    location_name: 'Kandy-Nuwara Eliya Road',
    latitude: 7.2906,
    longitude: 80.6337,
    timestamp: Date.now() - 22 * 60000,
    media_url: null,
    status: 'verified',
    admin_verification: {
      verified_by: 'admin-002',
      verified_time: Date.now() - 15 * 60000,
      response_team_status: 'on_site',
    },
    emergency_response_status: 'Heavy machinery deployed. Clearance in progress.',
  },
  {
    report_id: 'RPT-20260418-003',
    user_id: '#7234',
    trust_score: 88,
    severity_level: 'HIGH',
    description: 'Batticaloa lagoon overflowing. Brackish water entering agricultural lands. Crop damage expected.',
    location_name: 'Batticaloa Lagoon Area',
    latitude: 7.7097,
    longitude: 81.7926,
    timestamp: Date.now() - 35 * 60000,
    media_url: 'https://example.com/flood2.jpg',
    status: 'response_dispatched',
    admin_verification: {
      verified_by: 'analyst-001',
      verified_time: Date.now() - 25 * 60000,
      response_team_status: 'dispatched',
    },
    emergency_response_status: 'Agricultural advisory team notified. Drainage monitors activated.',
  },
  {
    report_id: 'RPT-20260418-004',
    user_id: '#4156',
    trust_score: 79,
    severity_level: 'MEDIUM',
    description: 'Power lines down in Gampaha. Multiple neighborhoods without electricity.',
    location_name: 'Gampaha Town Center',
    latitude: 7.0833,
    longitude: 80.7500,
    timestamp: Date.now() - 58 * 60000,
    media_url: null,
    status: 'verified',
    admin_verification: {
      verified_by: 'admin-003',
      verified_time: Date.now() - 45 * 60000,
      response_team_status: 'completed',
    },
    emergency_response_status: 'Power restoration team restored electricity. 4 hours repair time.',
  },
  {
    report_id: 'RPT-20260418-005',
    user_id: '#8945',
    trust_score: 81,
    severity_level: 'MEDIUM',
    description: 'Water level rising in Kalutara town. Shops and homes in low areas being evacuated.',
    location_name: 'Kalutara Town',
    latitude: 6.5910,
    longitude: 80.3546,
    timestamp: Date.now() - 72 * 60000,
    media_url: 'https://example.com/flood3.jpg',
    status: 'verified',
    admin_verification: {
      verified_by: 'analyst-002',
      verified_time: Date.now() - 60 * 60000,
      response_team_status: 'on_site',
    },
    emergency_response_status: '350 people evacuated to 2 shelters. Monitoring water level.',
  },
  {
    report_id: 'RPT-20260418-006',
    user_id: '#2389',
    trust_score: 72,
    severity_level: 'LOW',
    description: 'Small stream overflow near Anuradhapura. Farmers moving cattle to higher ground.',
    location_name: 'Anuradhapura District',
    latitude: 8.3116,
    longitude: 80.4137,
    timestamp: Date.now() - 120 * 60000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: 'Monitoring situation. No immediate action needed.',
  },
  {
    report_id: 'RPT-20260418-007',
    user_id: '#6789',
    trust_score: 86,
    severity_level: 'HIGH',
    description: 'Hospital basement flooded. Generator systems at risk. Patient transfer underway.',
    location_name: 'Central Hospital, Colombo',
    latitude: 6.9271,
    longitude: 80.6393,
    timestamp: Date.now() - 14 * 60000,
    media_url: null,
    status: 'verified',
    admin_verification: {
      verified_by: 'admin-001',
      verified_time: Date.now() - 10 * 60000,
      response_team_status: 'on_site',
    },
    emergency_response_status: 'Emergency generators deployed. 45 patients transferred safely.',
  },
  {
    report_id: 'RPT-20260418-008',
    user_id: '#3456',
    trust_score: 83,
    severity_level: 'MEDIUM',
    description: 'Bridge over Kelani River at risk. Structural damage visible. Access restricted.',
    location_name: 'Kelani Bridge, Gampaha',
    latitude: 7.0500,
    longitude: 80.7900,
    timestamp: Date.now() - 95 * 60000,
    media_url: 'https://example.com/flood4.jpg',
    status: 'verified',
    admin_verification: {
      verified_by: 'engineer-001',
      verified_time: Date.now() - 85 * 60000,
      response_team_status: 'on_site',
    },
    emergency_response_status: 'Structural engineers inspecting. Bridge closed. Alternate routes advised.',
  },
  {
    report_id: 'RPT-20260418-009',
    user_id: '#1234',
    trust_score: 78,
    severity_level: 'LOW',
    description: 'Drainage system clogged in residential area. Water pooling on streets.',
    location_name: 'Mount Lavinia, Colombo',
    latitude: 6.8386,
    longitude: 80.7686,
    timestamp: Date.now() - 145 * 60000,
    media_url: null,
    status: 'pending',
    admin_verification: null,
    emergency_response_status: 'Scheduled for maintenance crew. No immediate danger.',
  },
  {
    report_id: 'RPT-20260418-010',
    user_id: '#9876',
    trust_score: 89,
    severity_level: 'CRITICAL',
    description: 'School building compromised by landslide. Structural failure imminent. 200 children inside.',
    location_name: 'Matara District School',
    latitude: 5.9497,
    longitude: 80.5353,
    timestamp: Date.now() - 3 * 60000,
    media_url: 'https://example.com/flood5.jpg',
    status: 'verified',
    admin_verification: {
      verified_by: 'admin-safety',
      verified_time: Date.now() - 1 * 60000,
      response_team_status: 'on_site',
    },
    emergency_response_status: 'URGENT: All children evacuated. Structural support teams deployed.',
  },
];

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: SEED_REPORTS,

  hydrateReports: (incoming) => {
    console.debug('[DEBUG] hydrateReports called with:', incoming?.length || 0, 'items');
    if (!Array.isArray(incoming)) {
      console.warn('[DEBUG] hydrateReports: incoming is not an array!', typeof incoming);
      return;
    }
    const normalized = incoming
      .map((item, idx) => {
        const result = normalizeReport(item);
        if (!result && idx === 0) {
          console.warn('[DEBUG] First report failed to normalize:', item);
        }
        return result;
      })
      .filter((item): item is FloodReport => item !== null);
    console.debug('[DEBUG] After normalization:', normalized.length, 'valid reports');
    if (normalized.length > 0) {
      set({ reports: sortReports(normalized) });
      console.debug('[DEBUG] Store updated with', normalized.length, 'reports');
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
