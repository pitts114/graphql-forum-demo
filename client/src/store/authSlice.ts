import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { apiClient, type User, type LoginRequest, type RegisterRequest } from '../../lib/apiClient'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  profileCheckAttempted: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  profileCheckAttempted: false,
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest) => {
    const response = await apiClient.login(credentials)
    return response.user!
  }
)

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest) => {
    const response = await apiClient.register(userData)
    return response.user!
  }
)

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await apiClient.logout()
  }
)

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async () => {
    const response = await apiClient.getProfile()
    return response.user!
  }
)

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
        state.error = null
        state.profileCheckAttempted = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.error.message || 'Login failed'
      })
      
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
        state.error = null
        state.profileCheckAttempted = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.error = action.error.message || 'Registration failed'
      })
      
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.error = null
        state.loading = false
        state.profileCheckAttempted = false
      })
      
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true
        state.profileCheckAttempted = true
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
      })
  },
})

export const { clearError, clearAuth } = authSlice.actions

export default authSlice.reducer