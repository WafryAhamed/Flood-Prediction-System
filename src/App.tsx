import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { Navigation } from './components/Navigation';
import { ModeSelector } from './components/ModeSelector';
import { EmergencyQuickDial } from './components/EmergencyQuickDial';
import { VoiceNarration } from './components/VoiceNarration';
import { AccessibilityPanel } from './components/AccessibilityPanel';
import { CitizenChatbot } from './components/CitizenChatbot';
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
export function App() {
  return <AccessibilityProvider>
      <Router>
        <div className="min-h-screen bg-white font-sans text-black">
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
                  <ModeSelector />
                  <EmergencyQuickDial />
                  <VoiceNarration />
                  <AccessibilityPanel />
                  <CitizenChatbot />
                  <div className="md:pl-64 transition-all duration-300">
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
                  </div>
                </>} />
          </Routes>
        </div>
      </Router>
    </AccessibilityProvider>;
}