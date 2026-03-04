// Authentication & User Types
export interface User {
  _id?: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  location?: {
    district: string;
    lat: number;
    lng: number;
  };
  role: 'citizen' | 'supervisor' | 'admin' | 'system';
  isVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  name: string;
}

// Safety Profile Types
export interface SafetyProfile {
  _id?: string;
  userId: string;
  emergencyContacts: {
    name: string;
    phone: string;
    relationship: string;
  }[];
  mobilityNeeds?: string;
  medicalConditions?: string[];
  evacuationPlans?: {
    location: string;
    route: string;
    contact: string;
  }[];
  safeHaven?: {
    address: string;
    lat: number;
    lng: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// Risk & Alert Types
export interface Alert {
  _id?: string;
  type: 'flood' | 'landslide' | 'storm' | 'evacuation' | 'info';
  severity: 'critical' | 'warning' | 'caution' | 'info';
  title: string;
  description: string;
  location?: {
    district: string;
    lat: number;
    lng: number;
  };
  radius?: number;
  actionRequired?: string;
  affectedAreas?: string[];
  issuedAt: Date;
  expiresAt?: Date;
  acknowledged?: boolean;
  createdAt?: Date;
}

export interface RiskData {
  _id?: string;
  location: {
    district: string;
    lat: number;
    lng: number;
  };
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  riskScore: number; // 0-100
  factors: {
    rainfall: number;
    flooding: number;
    evacuation: number;
    infrastructure: number;
  };
  timestamp: Date;
  forecastedRisk?: number; // 0-100 for next 24h
  historicalPattern?: {
    avgRiskLastMonth: number;
    peakRiskLastMonth: number;
  };
}

// Community Report Types
export interface CommunityReport {
  _id?: string;
  userId: string;
  category: 'observation' | 'need' | 'help_available' | 'infrastructure';
  title: string;
  description: string;
  location: {
    district: string;
    lat: number;
    lng: number;
  };
  image?: string;
  status: 'active' | 'resolved' | 'archived';
  helpCount: number;
  comments: Comment[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface Comment {
  _id?: string;
  userId: string;
  text: string;
  createdAt: Date;
}

// Evacuation Plan Types
export interface EvacuationPlan {
  _id?: string;
  userId: string;
  startPoint: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    capacity: number;
  };
  routes: {
    primary: RouteStep[];
    alternate?: RouteStep[];
  };
  conditions: {
    weather: string;
    traffic: string;
    roadStatus: string;
  };
  estimatedTime: number; // minutes
  groupMembers: string[];
  specialNeeds?: string;
  status: 'planned' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt?: Date;
}

export interface RouteStep {
  lat: number;
  lng: number;
  instruction: string;
  distance: number; // meters
  duration: number; // seconds
}

// Admin Types
export interface AdminAction {
  _id?: string;
  actionType: 'alert_broadcast' | 'report_moderation' | 'user_management' | 'data_upload' | 'model_run';
  performer: string; // admin user ID
  target?: string; // affected resource ID
  details: Record<string, any>;
  timestamp: Date;
}

export interface Analytics {
  _id?: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    totalUsers: number;
    activeUsers: number;
    alertsIssued: number;
    reportsSubmitted: number;
    evacuationsInitiated: number;
    criticalRiskAreas: number;
  };
}

// Learning Hub Types
export interface GuidanceContent {
  _id?: string;
  category: 'preparation' | 'at_risk' | 'evacuation' | 'recovery' | 'special_needs';
  title: string;
  content: string;
  videoUrl?: string;
  tips?: string[];
  language: 'en' | 'si' | 'ta';
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Middleware Request
export interface CustomRequest extends Express.Request {
  user?: AuthPayload;
}
