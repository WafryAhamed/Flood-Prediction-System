// ─── Shared Domain Types: Admin → User Control Model ───
// Every type here represents data that admin can control and user pages consume.

// ═══ Severity & Risk ═══
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE';
export type AlertType = 'critical' | 'warning' | 'info' | 'all-clear';

// ═══ Public Alerts / Broadcasts ═══
export interface PublicBroadcast {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: number;
  district: string;
  severity: SeverityLevel;
  channels: ('sms' | 'push' | 'tv')[];
  active: boolean;
}

// ═══ Dashboard Broadcast Feed (user-facing) ═══
export interface BroadcastFeedItem {
  id: string;
  time: string;
  text: string;
  type: AlertType;
  active: boolean;
}

// ═══ Dashboard Resources ═══
export interface DashboardResource {
  id: string;
  name: string;
  status: 'OPEN' | 'FULL' | 'BUSY' | 'AVAILABLE' | 'CLOSED';
  statusColor: string;
  visible: boolean;
}

// ═══ Agriculture Advisories ═══
export interface AgricultureAdvisory {
  id: string;
  cropName: string;
  iconName: string;
  statusLabel: string;
  statusColor: string;
  message: string;
}

export interface AgricultureActionItem {
  id: string;
  text: string;
  order: number;
}

export interface AgricultureRiskZone {
  id: string;
  label: string;
  riskLevel: RiskLevel;
  district: string;
  details: string;
  accentColor: string;
}

// ═══ Recovery Updates ═══
export interface RecoveryProgressItem {
  id: string;
  label: string;
  percent: number;
  color: string;
}

export interface RecoveryCriticalNeed {
  id: string;
  name: string;
  urgency: SeverityLevel;
}

export interface RecoveryUpdate {
  id: string;
  iconName: string;
  title: string;
  time: string;
}

export interface RecoveryResource {
  id: string;
  name: string;
  detail: string;
}

// ═══ Learn Hub Content ═══
export interface LearnGuide {
  id: string;
  title: string;
  iconName: string;
  description: string;
  accentColor: string;
  visible: boolean;
}

export interface LearnTipSection {
  id: string;
  title: string;
  tips: string[];
}

export interface FeaturedWisdom {
  quote: string;
  source: string;
  visible: boolean;
}

// ═══ District Configuration ═══
export interface DistrictConfig {
  id: string;
  name: string;
  riskLevel: RiskLevel;
  population: string;
  shelterReadiness: number;
  visible: boolean;
}

// ═══ Page Visibility Toggles ═══
export interface PageVisibilityConfig {
  dashboard: boolean;
  riskMap: boolean;
  communityReports: boolean;
  evacuation: boolean;
  history: boolean;
  whatIf: boolean;
  agriculture: boolean;
  recovery: boolean;
  learnHub: boolean;
  safetyProfile: boolean;
}

// ═══ Frontend Settings (global) ═══
export interface FrontendSettings {
  emergencyBannerActive: boolean;
  emergencyBannerMessage: string;
  emergencyBannerRiskLevel: RiskLevel;
  siteFloodMode: 'normal' | 'watch' | 'emergency' | 'recovery';
  pageVisibility: PageVisibilityConfig;
  maintenanceMode: boolean;
}
