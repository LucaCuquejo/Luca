import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '@/services/api';

export interface CommunityGroup {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  postCount: number;
  isJoined: boolean;
}

export interface CommunityPost {
  id: string;
  author: { username: string; isAnonymous: boolean };
  content: string;
  supportCount: number;
  replyCount: number;
  createdAt: string;
  userSupported: boolean;
}

interface CommunityState {
  groups: CommunityGroup[];
  currentGroupId: string | null;
  posts: CommunityPost[];
  isLoading: boolean;
  isPosting: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: CommunityState = {
  groups: [],
  currentGroupId: null,
  posts: [],
  isLoading: false,
  isPosting: false,
  error: null,
  hasMore: true,
  page: 1,
};

export const loadGroups = createAsyncThunk('community/loadGroups', async () => {
  const response = await apiClient.get('/community/groups');
  return response.data.groups;
});

export const joinGroup = createAsyncThunk(
  'community/joinGroup',
  async (groupId: string) => {
    await apiClient.post(`/community/groups/${groupId}/join`);
    return groupId;
  }
);

export const leaveGroup = createAsyncThunk(
  'community/leaveGroup',
  async (groupId: string) => {
    await apiClient.delete(`/community/groups/${groupId}/join`);
    return groupId;
  }
);

export const loadPosts = createAsyncThunk(
  'community/loadPosts',
  async ({ groupId, page = 1 }: { groupId: string; page?: number }) => {
    const response = await apiClient.get(
      `/community/groups/${groupId}/posts?page=${page}&per_page=20`
    );
    return { posts: response.data.posts, page, pagination: response.data.pagination };
  }
);

export const createPost = createAsyncThunk(
  'community/createPost',
  async (
    { groupId, content, isAnonymous = true }: { groupId: string; content: string; isAnonymous?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(`/community/groups/${groupId}/posts`, {
        content,
        is_anonymous: isAnonymous,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const supportPost = createAsyncThunk(
  'community/supportPost',
  async (postId: string) => {
    await apiClient.post(`/community/posts/${postId}/support`, {
      reaction_type: 'support',
    });
    return postId;
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    setCurrentGroup: (state, action) => {
      state.currentGroupId = action.payload;
      state.posts = [];
      state.page = 1;
      state.hasMore = true;
    },
    addRealTimePost: (state, action) => {
      state.posts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGroups.fulfilled, (state, action) => {
        state.groups = action.payload;
      })
      .addCase(joinGroup.fulfilled, (state, action) => {
        const group = state.groups.find((g) => g.id === action.payload);
        if (group) group.isJoined = true;
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        const group = state.groups.find((g) => g.id === action.payload);
        if (group) group.isJoined = false;
      })
      .addCase(loadPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        const { posts, page, pagination } = action.payload;
        if (page === 1) {
          state.posts = posts;
        } else {
          state.posts.push(...posts);
        }
        state.page = page;
        state.hasMore = posts.length === 20;
      })
      .addCase(loadPosts.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(createPost.pending, (state) => {
        state.isPosting = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isPosting = false;
        if (action.payload.post) {
          state.posts.unshift(action.payload.post);
        }
      })
      .addCase(createPost.rejected, (state) => {
        state.isPosting = false;
      })
      .addCase(supportPost.fulfilled, (state, action) => {
        const post = state.posts.find((p) => p.id === action.payload);
        if (post) {
          post.userSupported = true;
          post.supportCount += 1;
        }
      });
  },
});

export const { setCurrentGroup, addRealTimePost } = communitySlice.actions;
export default communitySlice.reducer;
