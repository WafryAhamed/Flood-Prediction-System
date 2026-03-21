import { useState, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Navigation } from './components/Navigation';
import { EmergencyQuickDial } from './components/EmergencyQuickDial';
import { CitizenChatbot } from './components/CitizenChatbot';
import { AppLoader } from './components/AppLoader';
import { OnboardingFlow } from './components/OnboardingFlow';
import { useOnboardingComplete } from './hooks/useOnboarding';
import { OfflineBanner } from './components/OfflineBanner';
import { SafeModeBanner } from './components/SafeModeBanner';
import { QuickHelpButton } from './components/QuickHelpButton';
// Pages
import { EmergencyDashboard } from './pages/EmergencyDashboard';
import { RiskMapPage } from './pages/RiskMapPage';
import { CommunityReports } from './pages/CommunityReports';
import { EvacuationPlanner } from './pages/EvacuationPlanner';
import { HistoricalTimeline } from './pages/HistoricalTimeline';
import { WhatIfLab } from './pages/WhatIfLab';
import { AgricultureAdvisor } from './pages/AgricultureAdvisor';
import { RecoveryTracker } from './pages/RecoveryTracker';
import { LearnHub } from './pages/LearnHub';
import { SafetyProfile } from './pages/SafetyProfile';
// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminCommandCenter } from './pages/admin/AdminCommandCenter';
import { ModelControl } from './pages/admin/ModelControl';
import { ReportModeration } from './pages/admin/ReportModeration';
import { DistrictControl } from './pages/admin/DistrictControl';
import { FacilityManagement } from './pages/admin/FacilityManagement';
import { InfrastructureMonitor } from './pages/admin/InfrastructureMonitor';
import { AgricultureConsole } from './pages/admin/AgricultureConsole';
import { RecoveryCommand } from './pages/admin/RecoveryCommand';
import { AlertBroadcast } from './pages/admin/AlertBroadcast';
import { DataUpload } from './pages/admin/DataUpload';
import { AuditLogs } from './pages/admin/AuditLogs';
import { Analytics } from './pages/admin/Analytics';
import { FrontendControlCenter } from './pages/admin/FrontendControlCenter';
import { SystemMaintenance } from './pages/admin/SystemMaintenance';
import { UserManagement } from './pages/admin/UserManagement';
import { ChatbotControl } from './pages/admin/ChatbotControl';
import { useAdminControlStore } from './stores/adminControlStore';
import { usePlatformRealtimeSync } from './hooks/usePlatformRealtimeSync';

/** Wrapper to apply page transitions */
function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-pageIn">
      {children}
    </div>
  );
}

function AppContent() {
  usePlatformRealtimeSync();

  const onboardingDone = useOnboardingComplete();
  const [showOnboarding, setShowOnboarding] = useState(!onboardingDone);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-bg-primary font-sans text-text-primary">
      {/* Global banners */}
      <OfflineBanner />
      <Routes>
        {/* Admin Login - public */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<AdminRouteGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminCommandCenter />} />
          <Route path="model-control" element={<ModelControl />} />
          <Route path="reports" element={<ReportModeration />} />
          <Route path="districts" element={<DistrictControl />} />
          <Route path="facilities" element={<FacilityManagement />} />
          <Route path="infrastructure" element={<InfrastructureMonitor />} />
          <Route path="agriculture" element={<AgricultureConsole />} />
          <Route path="recovery" element={<RecoveryCommand />} />
          <Route path="broadcast" element={<AlertBroadcast />} />
          <Route path="data" element={<DataUpload />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="frontend" element={<FrontendControlCenter />} />
          <Route path="maintenance" element={<SystemMaintenance />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="chatbot" element={<ChatbotControl />} />
          </Route>
        </Route>

        {/* User Routes - With User Nav */}
        <Route path="*" element={<>
              <Navigation />
              {/* Floating Action Buttons: Chatbot + Emergency + Help */}
              <div className="fixed right-5 bottom-[90px] md:right-6 md:bottom-6 flex flex-col items-center gap-4 z-50">
                <CitizenChatbot />
                <EmergencyQuickDial />
              </div>
              <QuickHelpButton />
              <div className="md:pl-20 pb-20 md:pb-0 transition-all duration-200">
                <PageTransition>
                  <VisibilityRoutes />
                </PageTransition>
              </div>
            </>} />
      </Routes>
    </div>
  );
}

/** Bridge: reads admin store banner settings and feeds SafeModeBanner */
function AdminBannerBridge() {
  const { frontendSettings } = useAdminControlStore();
  if (!frontendSettings.emergencyBannerActive) return null;
  return <SafeModeBanner riskLevel={frontendSettings.emergencyBannerRiskLevel as any} message={frontendSettings.emergencyBannerMessage} />;
}

/** Routes gated by admin page-visibility toggles */
function VisibilityRoutes() {
  const frontendSettings = useAdminControlStore((s) => s.frontendSettings);
  // Memoize to prevent infinite selector evaluations
  const pv = useMemo(() => frontendSettings.pageVisibility, [frontendSettings]);
  return (
    <Routes>
      {pv.dashboard && <Route path="/" element={<EmergencyDashboard />} />}
      {pv.riskMap && <Route path="/map" element={<RiskMapPage />} />}
      {pv.communityReports && <Route path="/report" element={<CommunityReports />} />}
      {pv.evacuation && <Route path="/evacuate" element={<EvacuationPlanner />} />}
      {pv.history && <Route path="/history" element={<HistoricalTimeline />} />}
      {pv.whatIf && <Route path="/what-if" element={<WhatIfLab />} />}
      {pv.agriculture && <Route path="/agriculture" element={<AgricultureAdvisor />} />}
      {pv.recovery && <Route path="/recovery" element={<RecoveryTracker />} />}
      {pv.learnHub && <Route path="/learn" element={<LearnHub />} />}
      {pv.safetyProfile && <Route path="/profile" element={<SafetyProfile />} />}
      <Route path="/" element={<EmergencyDashboard />} />
    </Routes>
  );
}

export function App() {
  const [loaded, setLoaded] = useState(false);

  const handleLoaded = useCallback(() => {
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <AppLoader onFinished={handleLoaded} />;
  }

  return (
    <AccessibilityProvider>
      <Router>
        <AppContent />
      </Router>
    </AccessibilityProvider>
  );
}