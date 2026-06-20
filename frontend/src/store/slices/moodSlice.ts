import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/services/api';

export interface MoodEntry {
  id: string;
  score: number;
  stressLevel?: number;
  energyLevel?: number;
  anxietyLevel?: number;
  note?: string;
  source: string;
  recordedAt: string;
}

export interface MoodTrend {
  date: string;
  avgScore: number;
  avgStress?: number;
}

export interface MoodSummary {
  avgMood: number;
  avgStress: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  resilienceScore: number;
}

interface MoodState {
  entries: MoodEntry[];
  trends7d: MoodTrend[];
  trends30d: MoodTrend[];
  summary: MoodSummary | null;
  todayScore: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: MoodState = {
  entries: [],
  trends7d: [],
  trends30d: [],
  summary: null,
  todayScore: null,
  isLoading: false,
  error: null,
};

export const logMood = createAsyncThunk(
  'mood/log',
  async (data: {
    score: number;
    stressLevel?: number;
    energyLevel?: number;
    note?: string;
    source?: string;
  }) => {
    const response = await apiClient.post('/mood/entries', {
      score: data.score,
      stress_level: data.stressLevel,
      energy_level: data.energyLevel,
      note: data.note,
      source: data.source ?? 'manual',
    });
    return { ...response.data, score: data.score };
  }
);

export const loadMoodTrends = createAsyncThunk(
  'mood/loadTrends',
  async (period: '7d' | '30d') => {
    const response = await apiClient.get(`/mood/trends?period=${period}`);
    return { period, data: response.data };
  }
);

const moodSlice = createSlice({
  name: 'mood',
  initialState,
  reducers: {
    setTodayScore: (state, action) => {
      state.todayScore = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logMood.fulfilled, (state, action) => {
        state.todayScore = action.payload.score;
      })
      .addCase(loadMoodTrends.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadMoodTrends.fulfilled, (state, action) => {
        state.isLoading = false;
        const { period, data } = action.payload;
        if (period === '7d') {
          state.trends7d = data.entries;
          state.summary = data.summary;
        } else {
          state.trends30d = data.entries;
        }
      })
      .addCase(loadMoodTrends.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { setTodayScore } = moodSlice.actions;
export default moodSlice.reducer;
