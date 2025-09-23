import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import { forumApi } from './forumApi'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [forumApi.reducerPath]: forumApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(forumApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch