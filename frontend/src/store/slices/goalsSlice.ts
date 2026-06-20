import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/services/api';

export interface Goal {
  id: string;
  category: string;
  title: string;
  description?: string;
  currentLevel: number;
  targetLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  lastCompletedAt?: string;
  isActive: boolean;
  isCustom: boolean;
}

export interface GoalTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  level: number;
  xpReward: number;
}

export interface CompletionResult {
  completionId: string;
  xpEarned: number;
  newStreak: number;
  levelUp: boolean;
  milestoneEarned: string | null;
  celebrationMessage: string;
}

interface GoalsState {
  goals: Goal[];
  templates: GoalTemplate[];
  isLoading: boolean;
  lastCompletion: CompletionResult | null;
  error: string | null;
}

const initialState: GoalsState = {
  goals: [],
  templates: [],
  isLoading: false,
  lastCompletion: null,
  error: null,
};

export const loadGoals = createAsyncThunk('goals/load', async () => {
  const response = await apiClient.get('/goals');
  return response.data.goals;
});

export const loadTemplates = createAsyncThunk(
  'goals/loadTemplates',
  async (category?: string) => {
    const params = category ? `?category=${category}` : '';
    const response = await apiClient.get(`/goals/templates${params}`);
    return response.data.templates;
  }
);

export const addGoal = createAsyncThunk(
  'goals/add',
  async (data: { templateId?: string; category: string; title: string; isCustom?: boolean }) => {
    const response = await apiClient.post('/goals', {
      template_id: data.templateId,
      category: data.category,
      title: data.title,
      is_custom: data.isCustom ?? false,
    });
    return response.data.goal;
  }
);

export const completeGoal = createAsyncThunk(
  'goals/complete',
  async ({ goalId, note }: { goalId: string; note?: string }) => {
    const response = await apiClient.post(`/goals/${goalId}/complete`, { note });
    return { goalId, result: response.data };
  }
);

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    clearLastCompletion: (state) => {
      state.lastCompletion = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGoals.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadGoals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goals = action.payload;
      })
      .addCase(loadGoals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to load goals';
      })
      .addCase(loadTemplates.fulfilled, (state, action) => {
        state.templates = action.payload;
      })
      .addCase(addGoal.fulfilled, (state, action) => {
        state.goals.push(action.payload);
      })
      .addCase(completeGoal.fulfilled, (state, action) => {
        const { goalId, result } = action.payload;
        const goal = state.goals.find((g) => g.id === goalId);
        if (goal) {
          goal.currentStreak = result.newStreak;
          goal.totalCompletions += 1;
          goal.lastCompletedAt = new Date().toISOString();
          if (result.levelUp) {
            goal.currentLevel = Math.min(goal.currentLevel + 1, goal.targetLevel);
          }
        }
        state.lastCompletion = result;
      });
  },
});

export const { clearLastCompletion } = goalsSlice.actions;
export default goalsSlice.reducer;
