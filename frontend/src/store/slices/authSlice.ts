import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '@/services/api';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  countryCode: string;
  timezone: string;
  subscriptionTier: 'free' | 'premium';
  activeStruggles: string[];
  onboardingCompleted: boolean;
  notificationsEnabled: boolean;
  avatarColor: string;
}

export interface CrisisResource {
  organization: string;
  hotlineNumber: string;
  hotlineDisplay: string;
  availableHours: string;
  websiteUrl?: string;
}

interface AuthState {
  user: {
    id: string;
    email: string;
    profile: UserProfile | null;
    crisisResource: CrisisResource | null;
  } | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { user, access_token, refresh_token } = response.data;
      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('refresh_token', refresh_token);
      return { user, access_token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    data: { email: string; password: string; username: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user, access_token, refresh_token } = response.data;
      await SecureStore.setItemAsync('access_token', access_token);
      await SecureStore.setItemAsync('refresh_token', refresh_token);
      return { user, access_token };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  const token = await SecureStore.getItemAsync('access_token');
  if (!token) return null;
  const response = await apiClient.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { user: response.data, access_token: token };
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await apiClient.post('/auth/logout').catch(() => {});
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.user?.profile) {
        state.user.profile = { ...state.user.profile, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.accessToken = action.payload.access_token;
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setAccessToken, updateProfile, clearError } = authSlice.actions;
export default authSlice.reducer;
