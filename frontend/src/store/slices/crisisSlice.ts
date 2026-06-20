import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CrisisResource } from './authSlice';

interface CrisisState {
  isActive: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  eventId: string | null;
  resource: CrisisResource | null;
  triggerSource: 'chatbot' | 'community' | 'mood' | 'sos' | null;
  callInitiated: boolean;
  contactNotified: boolean;
}

const initialState: CrisisState = {
  isActive: false,
  severity: 'none',
  eventId: null,
  resource: null,
  triggerSource: null,
  callInitiated: false,
  contactNotified: false,
};

const crisisSlice = createSlice({
  name: 'crisis',
  initialState,
  reducers: {
    triggerCrisis: (
      state,
      action: PayloadAction<{
        severity: CrisisState['severity'];
        eventId: string;
        resource: CrisisResource;
        source: CrisisState['triggerSource'];
      }>
    ) => {
      state.isActive = true;
      state.severity = action.payload.severity;
      state.eventId = action.payload.eventId;
      state.resource = action.payload.resource;
      state.triggerSource = action.payload.source;
      state.callInitiated = false;
      state.contactNotified = false;
    },
    markCallInitiated: (state) => {
      state.callInitiated = true;
    },
    markContactNotified: (state) => {
      state.contactNotified = true;
    },
    dismissCrisis: (state) => {
      state.isActive = false;
      // Keep eventId and resource for follow-up, just hide overlay
    },
    resetCrisis: () => initialState,
  },
});

export const {
  triggerCrisis,
  markCallInitiated,
  markContactNotified,
  dismissCrisis,
  resetCrisis,
} = crisisSlice.actions;
export default crisisSlice.reducer;
