import { useState, useCallback } from 'react';
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
import { AdminLayout } from './pages/admin/AdminLayout';
import { SituationRoom } from './pages/admin/SituationRoom';
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
        {/* Admin Routes - No User Nav */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<SituationRoom />} />
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
        </Route>

        {/* User Routes - With User Nav */}
        <Route path="*" element={<>
              <Navigation />
              <SafeModeBanner riskLevel="CRITICAL" />
              {/* Floating Action Buttons: Chatbot + Emergency + Help */}
              <div className="fixed right-5 bottom-[90px] md:right-6 md:bottom-6 flex flex-col items-center gap-4 z-50">
                <CitizenChatbot />
                <EmergencyQuickDial />
              </div>
              <QuickHelpButton />
              <div className="md:pl-20 pb-20 md:pb-0 transition-all duration-200">
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<EmergencyDashboard />} />
                    <Route path="/map" element={<RiskMapPage />} />
                    <Route path="/report" element={<CommunityReports />} />
                    <Route path="/evacuate" element={<EvacuationPlanner />} />
                    <Route path="/history" element={<HistoricalTimeline />} />
                    <Route path="/what-if" element={<WhatIfLab />} />
                    <Route path="/agriculture" element={<AgricultureAdvisor />} />
                    <Route path="/recovery" element={<RecoveryTracker />} />
                    <Route path="/learn" element={<LearnHub />} />
                    <Route path="/profile" element={<SafetyProfile />} />
                  </Routes>
                </PageTransition>
              </div>
            </>} />
      </Routes>
    </div>
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