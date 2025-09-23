# Forum Client

A React TypeScript frontend for the spa-demo forum application, showcasing two different data fetching approaches: GraphQL with Apollo Client and REST with Redux Toolkit Query.

## Features

- **Dual Implementation Architecture**: Side-by-side comparison of GraphQL and REST approaches
- **Authentication**: Session-based auth with protected routes
- **Forum Functionality**: Create threads, post comments, like/unlike comments
- **Real-time Updates**: Optimistic updates and cache invalidation
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling and development server
- **React Router 7** for client-side routing
- **GraphQL Stack**:
  - Apollo Client for GraphQL data fetching
  - Optimistic updates and intelligent caching
- **REST Stack**:
  - Redux Toolkit Query (RTK Query) for REST API calls
  - Tag-based cache invalidation
  - Redux for state management
- **Styling**: Inline styles (production apps would use CSS modules/styled-components)

## Project Structure

```
src/
├── components/
│   ├── ForumRedux/           # Redux implementation components
│   │   ├── ForumPageRedux.tsx
│   │   └── ThreadPageRedux.tsx
│   ├── ForumPage.tsx         # GraphQL implementation
│   ├── ThreadPage.tsx        # GraphQL implementation
│   ├── LoginForm.tsx
│   ├── ProfileView.tsx
│   └── PrivateRoute.tsx
├── apollo/
│   ├── client.ts             # Apollo Client configuration
│   └── queries.ts            # GraphQL queries and mutations
├── store/
│   ├── index.ts              # Redux store configuration
│   ├── authSlice.ts          # Authentication state
│   ├── forumApi.ts           # RTK Query API slice
│   └── hooks.ts              # Typed Redux hooks
├── services/
│   └── apiClient.ts          # Shared API utilities
└── App.tsx                   # Main application with routing
```

## Getting Started

### Prerequisites

- Node.js 20+ (specified in `.nvmrc`)
- npm or yarn
- Running backend server (see `../server/README.md`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The client will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Architecture Comparison

This application demonstrates two approaches to the same forum functionality:

### GraphQL + Apollo Client (`/forum`)

**Files**: `ForumPage.tsx`, `ThreadPage.tsx`, `apollo/`

**Benefits**:
- Single endpoint for all data needs
- Declarative data fetching with `useQuery`
- Automatic query deduplication and batching
- Sophisticated caching with normalized cache
- Optimistic updates built-in
- Strong typing with generated types

**Example**:
```typescript
const { data, loading, error } = useQuery(GET_THREADS)
const [createThread] = useMutation(CREATE_THREAD, {
  refetchQueries: [{ query: GET_THREADS }]
})
```

### REST + Redux Toolkit Query (`/forum_redux`)

**Files**: `ForumRedux/`, `store/forumApi.ts`

**Benefits**:
- Familiar REST patterns
- RTK Query provides Apollo-like experience for REST
- Tag-based cache invalidation
- Excellent TypeScript integration
- Generated hooks for each endpoint
- Simplified optimistic updates

**Example**:
```typescript
const { data, isLoading, error } = useGetThreadsQuery()
const [createThread] = useCreateThreadMutation()
```

## Key Features Implemented

### Authentication
- Session-based authentication with cookies
- Protected routes using `PrivateRoute` component
- Automatic redirect to login for unauthenticated users

### Forum Functionality
- **Thread Listing**: View all forum threads with user info and comment counts
- **Thread Creation**: Create new discussion threads
- **Thread Detail**: View individual threads with all comments
- **Comments**: Post comments on threads
- **Likes**: Like/unlike comments with real-time count updates

### Performance Optimizations
- **DataLoader Pattern**: Server uses GraphQL DataLoaders to prevent N+1 queries
- **Cache Management**: Both implementations use intelligent caching
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Type Safety**: End-to-end TypeScript for reduced runtime errors

## Navigation

The app includes a navigation bar with links to compare both implementations:

- **Forum (GraphQL)** - `/forum` - Apollo Client implementation
- **Forum (Redux)** - `/forum_redux` - RTK Query implementation
- **Profile** - `/profile` - User profile and logout

## Configuration

### Environment Setup

The client expects the backend server to be running on `http://localhost:4567`:

- GraphQL endpoint: `http://localhost:4567/graphql`
- REST API endpoints: `http://localhost:4567/api/*`

### Apollo Client Config

Located in `apollo/client.ts`:
- Configured for cookie-based authentication
- Custom cache policies for optimistic updates
- Merge functions for proper data handling

### RTK Query Config

Located in `store/forumApi.ts`:
- RESTful endpoint definitions
- TypeScript interfaces for all data types
- Tag-based cache invalidation strategy
- Generated hooks for components

## Development Notes

### Code Style
- Functional components with hooks
- TypeScript strict mode enabled
- ESLint configured for React and TypeScript
- Inline styles for rapid prototyping (not recommended for production)

### State Management Philosophy
- **GraphQL Version**: Apollo Client manages server state, minimal local state
- **Redux Version**: RTK Query for server state, Redux for auth and local state
- Both approaches minimize prop drilling and provide declarative data access

### Error Handling
- GraphQL: Apollo's built-in error handling with `error` objects
- REST: RTK Query error handling with typed error responses
- User-friendly error messages for network failures

## Learning Objectives

This dual implementation helps understand:

1. **Data Fetching Patterns**: Compare declarative vs imperative approaches
2. **Caching Strategies**: Normalized GraphQL cache vs tag-based REST cache
3. **Type Safety**: How TypeScript integrates with each approach
4. **Developer Experience**: Tooling and debugging differences
5. **Performance**: Network efficiency and client-side optimization
6. **Complexity Trade-offs**: When to choose GraphQL vs REST

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure server CORS is configured for `http://localhost:5173`
2. **Authentication Issues**: Check that cookies are being sent with `credentials: 'include'`
3. **GraphQL Errors**: Use Apollo DevTools for query inspection
4. **Redux Issues**: Use Redux DevTools for state inspection

### Development Tools

- **Apollo DevTools**: Browser extension for GraphQL debugging
- **Redux DevTools**: Browser extension for Redux state inspection
- **React DevTools**: Component tree and props inspection
- **Network Tab**: Monitor API calls and responses

## Next Steps

For production deployment:

1. **Styling**: Replace inline styles with CSS modules or styled-components
2. **Error Boundaries**: Add React error boundaries for better error handling
3. **Testing**: Add unit tests with Jest and React Testing Library
4. **Performance**: Add React.memo, useMemo, and useCallback where needed
5. **Bundle Analysis**: Use webpack-bundle-analyzer to optimize bundle size
6. **Security**: Add Content Security Policy and other security headers
