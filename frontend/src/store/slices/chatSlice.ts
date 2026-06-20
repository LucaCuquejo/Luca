import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/services/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  sessionDate: string;
  moodStart?: number;
  moodEnd?: number;
  struggleIdentified?: string;
  crisisTriggered: boolean;
  messageCount: number;
  startedAt: string;
}

interface ChatState {
  currentConversationId: string | null;
  messages: Message[];
  conversations: Conversation[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  greeting: string | null;
}

const initialState: ChatState = {
  currentConversationId: null,
  messages: [],
  conversations: [],
  isLoading: false,
  isSending: false,
  error: null,
  greeting: null,
};

export const startConversation = createAsyncThunk(
  'chat/startConversation',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/chat/conversations');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start conversation');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { conversationId, content }: { conversationId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(
        `/chat/conversations/${conversationId}/messages`,
        { content }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const loadConversations = createAsyncThunk(
  'chat/loadConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/chat/conversations');
      return response.data.conversations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load conversations');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action: PayloadAction<string>) => {
      const msg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: action.payload,
        createdAt: new Date().toISOString(),
      };
      state.messages.push(msg);
    },
    clearCurrentConversation: (state) => {
      state.currentConversationId = null;
      state.messages = [];
      state.greeting = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startConversation.pending, (state) => {
        state.isLoading = true;
        state.messages = [];
      })
      .addCase(startConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversationId = action.payload.conversation_id;
        state.greeting = action.payload.greeting;
        state.messages = [
          {
            id: 'greeting',
            role: 'assistant',
            content: action.payload.greeting,
            createdAt: new Date().toISOString(),
          },
        ];
      })
      .addCase(startConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        if (!action.payload.crisis_detected) {
          state.messages.push({
            id: action.payload.reply.id,
            role: 'assistant',
            content: action.payload.reply.content,
            createdAt: action.payload.reply.created_at,
          });
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      });
  },
});

export const { addUserMessage, clearCurrentConversation } = chatSlice.actions;
export default chatSlice.reducer;
