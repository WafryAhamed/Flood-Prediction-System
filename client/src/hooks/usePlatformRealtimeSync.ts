import { useEffect } from 'react';
import { fetchBootstrapState, openRealtimeStream } from '../services/integrationApi';
import type { RealtimeEventEnvelope } from '../services/integrationApi';
import { useAdminControlStore } from '../stores/adminControlStore';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import { useReportStore } from '../stores/reportStore';

// Polling interval used only when SSE is disconnected
const FALLBACK_SYNC_MS = 30000;

export function usePlatformRealtimeSync() {
  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;

    const syncAll = async () => {
      try {
        const snapshot = await fetchBootstrapState();
        if (!active) return;
        useAdminControlStore.getState().hydrateFromBackend(snapshot.adminControl);
        useMaintenanceStore.getState().hydrateFromBackend(snapshot.maintenance);
        useReportStore.getState().hydrateReports(snapshot.reports);
      } catch (error) {
        console.warn('Realtime sync bootstrap failed:', error);
      }
    };

    /**
     * Handle individual SSE events with targeted store updates.
     * Only falls back to a full bootstrap fetch for unknown event types.
     */
    const handleEvent = (envelope: RealtimeEventEnvelope) => {
      if (!active) return;
      const { event, payload } = envelope;

      switch (event) {
        case 'keepalive':
        case 'connected':
          // Heartbeat / connection ack — no store update needed
          break;

        case 'adminControl.updated':
          if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            useAdminControlStore
              .getState()
              .hydrateFromBackend(payload as Record<string, unknown>);
          }
          break;

        case 'maintenance.updated':
          if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
            useMaintenanceStore
              .getState()
              .hydrateFromBackend(payload as Record<string, unknown>);
          }
          break;

        case 'report.created':
        case 'report.updated':
          useReportStore.getState().upsertReport(payload);
          break;

        default:
          // Unknown event — do a full bootstrap sync
          void syncAll();
          break;
      }
    };

    // Initial full sync on mount
    void syncAll();

    try {
      eventSource = openRealtimeStream(handleEvent);
    } catch (error) {
      console.warn('Realtime stream unavailable, using polling fallback only:', error);
    }

    // Polling fallback: only syncs when SSE is not connected
    const pollId = window.setInterval(() => {
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        void syncAll();
      }
    }, FALLBACK_SYNC_MS);

    return () => {
      active = false;
      window.clearInterval(pollId);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);
}
