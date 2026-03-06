import { create } from 'zustand';

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
  status: 'pending' | 'verified' | 'rejected';
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

interface ReportStore {
  reports: FloodReport[];
  addReport: (report: Omit<FloodReport, 'report_id' | 'status' | 'timestamp' | 'user_id' | 'trust_score'>) => void;
  verifyReport: (reportId: string) => void;
  rejectReport: (reportId: string) => void;
  getPendingReports: () => FloodReport[];
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
  },
];

export const useReportStore = create<ReportStore>((set, get) => ({
  reports: SEED_REPORTS,

  addReport: (partial) => {
    const report: FloodReport = {
      ...partial,
      report_id: generateId(),
      user_id: generateUserId(),
      trust_score: generateTrustScore(),
      timestamp: Date.now(),
      status: 'pending',
    };
    set((state) => ({
      reports: [report, ...state.reports].slice(0, 50),
    }));
  },

  verifyReport: (reportId) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.report_id === reportId ? { ...r, status: 'verified' as const } : r
      ),
    }));
  },

  rejectReport: (reportId) => {
    set((state) => ({
      reports: state.reports.map((r) =>
        r.report_id === reportId ? { ...r, status: 'rejected' as const } : r
      ),
    }));
  },

  getPendingReports: () => {
    return sortReports(get().reports.filter((r) => r.status === 'pending'));
  },
}));
