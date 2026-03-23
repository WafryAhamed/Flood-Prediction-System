import { useEffect } from 'react';
import { fetchBootstrapState, openRealtimeStream, saveAdminControlState } from '../services/integrationApi';
import type { RealtimeEventEnvelope } from '../services/integrationApi';
import { useAdminControlStore } from '../stores/adminControlStore';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import { useReportStore } from '../stores/reportStore';

// Polling interval used only when SSE is disconnected
const FALLBACK_SYNC_MS = 30000;

// SSE reconnection with exponential backoff
const MIN_RECONNECT_DELAY = 1000;  // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export function usePlatformRealtimeSync() {
  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const syncAll = async () => {
      try {
        const snapshot = await fetchBootstrapState();
        if (!active) return;
        useAdminControlStore.getState().hydrateFromBackend(snapshot.adminControl);
        useMaintenanceStore.getState().hydrateFromBackend(snapshot.maintenance);
        useReportStore.getState().hydrateReports(snapshot.reports);
      } catch (error) {
        // Silently fail; fallback polling will retry
        // Only log if it's an unusual error, not just connection refused
        if (error instanceof Error && !error.message.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('[Sync] Bootstrap fetch failed:', error.message);
        }
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
          // Reset reconnect attempts on successful connection
          if (event === 'connected') {
            reconnectAttempts = 0;
          }
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

    /**
     * Attempt to reconnect SSE with exponential backoff.
     * After reconnection, ensure we have the latest state.
     */
    const reconnectSSE = () => {
      if (!active) return;
      
      const delay = Math.min(
        MIN_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
        MAX_RECONNECT_DELAY
      );
      
      reconnectAttempts++;
      
      if (reconnectAttempts > 1) {
        // Only log after first reconnect attempt
        console.info(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
      }

      reconnectTimeout = setTimeout(() => {
        if (!active) return;
        
        try {
          eventSource = openRealtimeStream(
            handleEvent,
            (_evt) => {
              // On error, schedule reconnect
              if (active) {
                reconnectSSE();
              }
            }
          );
        } catch (error) {
          console.warn('[SSE] Failed to open stream:', error);
          reconnectSSE();
        }
      }, delay);
    };

    // Initial sync + SSE connection
    (async () => {
      try {
        // CRITICAL FIX: Bootstrap from backend to ensure adminControl is fresh
        // This hydrates adminControlStore with real data, not just seed defaults
        // Prevents stale admin data if SSE connection fails during initial load
        const snapshot = await fetchBootstrapState();
        if (!active) return;

        useAdminControlStore.getState().hydrateFromBackend(snapshot.adminControl);
        useMaintenanceStore.getState().hydrateFromBackend(snapshot.maintenance);
        useReportStore.getState().hydrateReports(snapshot.reports);

        console.info('[Sync] Bootstrap complete', snapshot);
      } catch (error) {
        // Fallback to seed data if bootstrap fails; SSE will resync when available
        if (error instanceof Error && !error.message.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('[Sync] Bootstrap fetch failed, using seed defaults:', error.message);
        }
      }

      if (!active) return;

      try {
        eventSource = openRealtimeStream(
          handleEvent,
          (_evt) => {
            // On SSE error, schedule reconnect
            if (active) {
              reconnectSSE();
            }
          }
        );
      } catch (error) {
        console.warn('[SSE] Initial connection failed:', error);
        reconnectSSE();
      }
    })();

    // Polling fallback: syncs when SSE is not connected
    // This provides resilience if SSE is permanently unavailable
    pollInterval = window.setInterval(() => {
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        void syncAll();
      }
    }, FALLBACK_SYNC_MS);

    /**
     * CRITICAL FIX #2: Flush pending adminControl saves before unload
     * If user closes browser before 500ms debounce timeout, changes would be lost.
     * This handler ensures immediate persistence on page unload/reload.
     */
    const handleBeforeUnload = () => {
      const state = useAdminControlStore.getState();
      const persistableState = {
        broadcastFeed: state.broadcastFeed,
        dashboardResources: state.dashboardResources,
        agricultureAdvisories: state.agricultureAdvisories,
        agricultureActions: state.agricultureActions,
        agricultureZones: state.agricultureZones,
        recoveryProgress: state.recoveryProgress,
        recoveryNeeds: state.recoveryNeeds,
        recoveryUpdates: state.recoveryUpdates,
        recoveryResources: state.recoveryResources,
        learnGuides: state.learnGuides,
        learnTips: state.learnTips,
        featuredWisdom: state.featuredWisdom,
        frontendSettings: state.frontendSettings,
      };
      // Fire-and-forget: best effort to save before window closes
      // No await needed since browser will close anyway
      void saveAdminControlState(persistableState).catch((error) => {
        console.warn('[Unload] Failed to flush adminControl state:', error);
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      active = false;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (eventSource) {
        eventSource.close();
      }
      // Clean up beforeunload handler
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
