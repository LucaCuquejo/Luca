import { Linking } from 'react-native';
import { apiClient } from './api';
import { store } from '@/store';
import {
  triggerCrisis,
  markCallInitiated,
  markContactNotified,
  dismissCrisis,
} from '@/store/slices/crisisSlice';

export async function activateCrisisProtocol(
  severity: 'low' | 'medium' | 'high' | 'critical',
  source: 'chatbot' | 'community' | 'mood' | 'sos',
  eventId: string
) {
  const state = store.getState();
  const crisisResource = state.auth.user?.crisisResource;

  if (!crisisResource) return;

  store.dispatch(
    triggerCrisis({
      severity,
      eventId,
      resource: crisisResource,
      source,
    })
  );
}

export async function triggerManualSOS(): Promise<void> {
  try {
    const response = await apiClient.post('/crisis/sos');
    const { crisis_event_id, crisis_resource } = response.data;

    store.dispatch(
      triggerCrisis({
        severity: 'high',
        eventId: crisis_event_id,
        resource: crisis_resource,
        source: 'sos',
      })
    );
  } catch {
    // Even if API fails, show crisis resources (cached locally)
    const state = store.getState();
    const crisisResource = state.auth.user?.crisisResource;
    if (crisisResource) {
      store.dispatch(
        triggerCrisis({
          severity: 'high',
          eventId: 'offline',
          resource: crisisResource,
          source: 'sos',
        })
      );
    }
  }
}

export async function initiateHotlineCall(eventId: string, hotlineNumber: string): Promise<void> {
  const phoneUrl = `tel:${hotlineNumber}`;
  const canOpen = await Linking.canOpenURL(phoneUrl);

  if (canOpen) {
    store.dispatch(markCallInitiated());
    if (eventId !== 'offline') {
      apiClient.post(`/crisis/${eventId}/call-initiated`).catch(() => {});
    }
    await Linking.openURL(phoneUrl);
  }
}

export async function notifyEmergencyContact(eventId: string): Promise<void> {
  try {
    await apiClient.post(`/crisis/${eventId}/contact-notified`);
    store.dispatch(markContactNotified());
  } catch {
    // Silent fail — user experience takes priority
  }
}

export async function dismissCrisisOverlay(eventId: string): Promise<void> {
  store.dispatch(dismissCrisis());
  if (eventId !== 'offline') {
    apiClient.post(`/crisis/${eventId}/dismissed`).catch(() => {});
  }
}
