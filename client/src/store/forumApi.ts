import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define interfaces for the API response types
export interface User {
  id: string
  username: string
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  likesCount: number
  isLikedByCurrentUser: boolean
  user: User
}

export interface Thread {
  id: string
  title: string
  content: string
  createdAt: string
  commentCount: number
  user: User
  comments?: Comment[]
}

export interface ThreadsResponse {
  threads: Thread[]
}

export interface ThreadResponse {
  thread: Thread
}

export interface CommentResponse {
  comment: Comment
}

export interface ToggleLikeResponse {
  liked: boolean
  likesCount: number
  commentId: string
}

// Create the API slice using RTK Query
export const forumApi = createApi({
  reducerPath: 'forumApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:4567/api',
    credentials: 'include', // Include cookies for authentication
  }),
  tagTypes: ['Thread', 'Comment', 'Like'],
  endpoints: (builder) => ({
    // Get all threads
    getThreads: builder.query<ThreadsResponse, void>({
      query: () => '/threads',
      providesTags: ['Thread'],
    }),

    // Get single thread with comments
    getThread: builder.query<ThreadResponse, string>({
      query: (id) => `/threads/${id}`,
      providesTags: (result, error, id) => [
        { type: 'Thread', id },
        { type: 'Comment', id: 'LIST' },
      ],
    }),

    // Create a new thread
    createThread: builder.mutation<ThreadResponse, { title: string; content: string }>({
      query: (body) => ({
        url: '/threads',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Thread'],
    }),

    // Create a new comment
    createComment: builder.mutation<CommentResponse, { threadId: string; content: string }>({
      query: ({ threadId, content }) => ({
        url: `/threads/${threadId}/comments`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: (result, error, { threadId }) => [
        { type: 'Thread', id: threadId },
        { type: 'Comment', id: 'LIST' },
      ],
    }),

    // Toggle like on a comment
    toggleLike: builder.mutation<ToggleLikeResponse, string>({
      query: (commentId) => ({
        url: `/comments/${commentId}/toggle-like`,
        method: 'POST',
      }),
      // Use cache invalidation instead of complex optimistic updates for now
      invalidatesTags: ['Thread'],
    }),
  }),
})

// Export hooks for usage in components
export const {
  useGetThreadsQuery,
  useGetThreadQuery,
  useCreateThreadMutation,
  useCreateCommentMutation,
  useToggleLikeMutation,
} = forumApi