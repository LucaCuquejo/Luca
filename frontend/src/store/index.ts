import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import goalsReducer from './slices/goalsSlice';
import moodReducer from './slices/moodSlice';
import crisisReducer from './slices/crisisSlice';
import communityReducer from './slices/communitySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    goals: goalsReducer,
    mood: moodReducer,
    crisis: crisisReducer,
    community: communityReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
