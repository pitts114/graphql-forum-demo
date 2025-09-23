# Forum Server

A Ruby Sinatra backend providing both GraphQL and REST APIs for the spa-demo forum application. Features session-based authentication, PostgreSQL database, and optimized data loading with GraphQL DataLoaders.

## Features

- **Dual API Architecture**: GraphQL and REST endpoints for the same data
- **GraphQL DataLoaders**: Optimized N+1 query resolution using GraphQL::Dataloader
- **Session Authentication**: Cookie-based authentication with secure session management
- **PostgreSQL Database**: Robust relational database with proper schema design
- **CORS Support**: Configured for cross-origin requests from frontend
- **Development Tools**: Hot reloading with rerun gem

## Tech Stack

- **Ruby 3.4.4** with Sinatra 4.0
- **PostgreSQL** for data persistence
- **GraphQL Ruby** for GraphQL API implementation
- **Rack CORS** for cross-origin resource sharing
- **BCrypt** for password hashing
- **Puma** as the web server

## Database Schema

```sql
-- Users table
users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Forum threads
threads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Comments on threads
comments (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES threads(id),
  user_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

-- Likes on comments
likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES comments(id),
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
)
```

## Project Structure

```
server/
├── app.rb                    # Main Sinatra application
├── graphql_schema.rb         # GraphQL schema and type definitions
├── loaders.rb                # GraphQL DataLoader source classes
├── server.rb                 # Server startup script
├── Gemfile                   # Ruby dependencies
├── config.ru                 # Rack configuration
├── docker-compose.yml        # PostgreSQL setup
└── src/                      # Additional source files
```

## Getting Started

### Prerequisites

- Ruby 3.4.4 (specified in `.ruby-version`)
- Docker and Docker Compose
- Bundler gem

### Database Setup

```bash
# Start PostgreSQL with Docker Compose
docker compose up -d
```

### Installation

```bash
# Install Ruby dependencies
bundle install

# Start the development server (automatically creates database tables)
bundle exec ruby server.rb

# Or use rerun for auto-reload during development
bundle exec rerun -- ruby server.rb
```

**Note**: Database tables and schema are automatically created when the server starts. No separate migration step is required.

The server will be available at `http://localhost:4567`

## API Endpoints

### GraphQL API

**Endpoint**: `POST /graphql`

**Schema**: See `graphql_schema.rb` for complete type definitions

**Key Types**:
- `UserType`: User information and authentication
- `ThreadType`: Forum threads with comments
- `CommentType`: Comments with likes and user data
- `LikeType`: Like relationships

**Example Query**:
```graphql
query GetThreads {
  threads {
    id
    title
    content
    user {
      username
    }
    comments {
      id
      content
      likesCount
      user {
        username
      }
    }
  }
}
```

**Example Mutation**:
```graphql
mutation CreateThread($title: String!, $content: String!) {
  createThread(title: $title, content: $content) {
    id
    title
    user {
      username
    }
  }
}
```

### REST API

**Base URL**: `/api`

#### Authentication
- `POST /login` - Login with username/password
- `POST /logout` - Logout current user

#### Threads
- `GET /api/threads` - List all threads
- `POST /api/threads` - Create new thread
- `GET /api/threads/:id` - Get thread with comments

#### Comments
- `POST /api/threads/:id/comments` - Create comment on thread
- `POST /api/comments/:id/toggle-like` - Toggle like on comment

**Example Response**:
```json
{
  "threads": [
    {
      "id": "1",
      "title": "Welcome to the Forum",
      "content": "This is the first thread",
      "createdAt": "2024-09-01T10:00:00Z",
      "commentCount": 5,
      "user": {
        "id": "1",
        "username": "admin"
      }
    }
  ]
}
```

## DataLoader Architecture

The server implements the GraphQL DataLoader pattern to solve N+1 query problems:

### DataLoader Sources

Located in `loaders.rb`:

1. **UserSource**: Batch load users by ID
2. **CommentsByThreadSource**: Batch load comments for multiple threads
3. **LikesByCommentSource**: Batch load likes for multiple comments
4. **LikesCountSource**: Batch load like counts for multiple comments
5. **UserLikesSource**: Batch check if current user liked multiple comments

### How It Works

```ruby
# Instead of N+1 queries (bad):
threads.each do |thread|
  comments = db.exec("SELECT * FROM comments WHERE thread_id = #{thread.id}")
end

# DataLoader batches into single query (good):
def comments
  dataloader.with(CommentsByThreadSource, context[:db]).load(object['id'])
end
```

### Benefits

- **Performance**: Reduces database queries from O(N) to O(1)
- **Caching**: Automatic request-level caching of loaded data
- **Consistency**: Ensures data consistency within a single request
- **Maintainability**: Clean separation of data loading logic

## Authentication System

### Session Management

- **Cookie-based sessions**: Secure session cookies with `httpOnly` flag
- **In-memory storage**: Simple hash-based session store (development only)
- **Password hashing**: BCrypt for secure password storage
- **CORS credentials**: Configured to accept credentials from frontend

### Implementation

```ruby
# Login endpoint
post '/login' do
  user = authenticate_user(params[:username], params[:password])
  if user
    session_id = SecureRandom.hex(32)
    @@sessions[session_id] = { user_id: user['id'] }
    response.set_cookie('session_id', {
      value: session_id,
      httponly: true,
      secure: false, # Set to true in production with HTTPS
      max_age: 24 * 60 * 60 # 24 hours
    })
  end
end

# Authentication helper
def current_user
  session_id = request.cookies['session_id']
  return nil unless session_id && @@sessions[session_id]

  user_id = @@sessions[session_id][:user_id]
  @db.exec_params('SELECT * FROM users WHERE id = $1', [user_id]).first
end
```

## Database Connection

### Configuration

Environment variables for database connection:
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_USER` (default: postgres)
- `DB_PASSWORD` (default: password)
- `DB_NAME` (default: spa_demo)

### Connection Management

```ruby
def setup_database
  @db = PG.connect(
    host: ENV['DB_HOST'] || 'localhost',
    port: ENV['DB_PORT'] || 5432,
    user: ENV['DB_USER'] || 'postgres',
    password: ENV['DB_PASSWORD'] || 'password',
    dbname: ENV['DB_NAME'] || 'spa_demo'
  )
rescue PG::Error => e
  puts "Database connection failed: #{e.message}"
  puts "Make sure PostgreSQL is running and the database exists"
end
```

## Performance Optimizations

### Query Optimization

1. **DataLoader Pattern**: Eliminates N+1 queries
2. **Parameterized Queries**: Prevents SQL injection and improves performance
3. **JOIN Operations**: Single queries for related data where possible
4. **Index Usage**: Database indexes on foreign keys and frequently queried columns

### Example Optimized Query

```sql
-- Comments with user data and like status in single query
SELECT c.*, u.username,
       COALESCE(like_counts.count, 0) as likes_count,
       CASE WHEN user_likes.comment_id IS NOT NULL THEN true ELSE false END as is_liked_by_current_user
FROM comments c
JOIN users u ON c.user_id = u.id
LEFT JOIN (
  SELECT comment_id, COUNT(*) as count
  FROM likes
  GROUP BY comment_id
) like_counts ON c.id = like_counts.comment_id
LEFT JOIN likes user_likes ON c.id = user_likes.comment_id AND user_likes.user_id = $2
WHERE c.thread_id = $1
ORDER BY c.created_at ASC
```

## Development

### Running Tests

```bash
# Run with auto-reload for development
bundle exec rerun -- ruby server.rb

# Check for syntax errors
ruby -c app.rb
ruby -c graphql_schema.rb
ruby -c loaders.rb
```

### Debugging

1. **Server Logs**: All requests logged to console
2. **GraphQL Playground**: Available at `/graphql` for query testing
3. **Database Queries**: Enable query logging in PostgreSQL
4. **Error Handling**: Comprehensive error responses with stack traces in development

### Adding New Features

1. **Database Changes**: Update table creation in `app.rb`
2. **GraphQL Types**: Add new types to `graphql_schema.rb`
3. **DataLoaders**: Create new source classes in `loaders.rb`
4. **REST Endpoints**: Add new routes to `app.rb`

## Production Considerations

### Security

1. **HTTPS Only**: Set `secure: true` for cookies in production
2. **Environment Variables**: Use proper environment variable management
3. **Database Credentials**: Use secure credential storage
4. **CORS Configuration**: Restrict allowed origins
5. **Session Storage**: Replace in-memory sessions with Redis or database

### Performance

1. **Connection Pooling**: Implement PostgreSQL connection pooling
2. **Caching**: Add Redis for query result caching
3. **Rate Limiting**: Implement API rate limiting
4. **Monitoring**: Add application performance monitoring
5. **Load Balancing**: Configure for multiple server instances

### Deployment

```ruby
# Production configuration example
configure :production do
  set :session_secret, ENV['SESSION_SECRET']
  set :database_url, ENV['DATABASE_URL']

  # Database connection pooling
  use ConnectionPool::Wrapper, size: 5, timeout: 30 do
    PG.connect(ENV['DATABASE_URL'])
  end
end
```

## API Comparison

### GraphQL Benefits

- **Single Endpoint**: All data through `/graphql`
- **Query Flexibility**: Clients specify exact data needs
- **Type Safety**: Strong schema validation
- **Introspection**: Self-documenting API
- **DataLoader**: Built-in N+1 query optimization

### REST Benefits

- **Simplicity**: Familiar HTTP verbs and status codes
- **Caching**: HTTP caching with ETags and cache headers
- **Tools**: Standard REST tooling and monitoring
- **Debugging**: Easy to test with curl/Postman
- **Incremental Adoption**: Can be added endpoint by endpoint

## Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   - Ensure PostgreSQL is running
   - Verify connection parameters

2. **CORS Errors**:
   - Check allowed origins in CORS configuration
   - Ensure credentials are properly configured

3. **GraphQL Errors**:
   - Use GraphQL playground for query testing
   - Check schema definitions match queries
   - Verify DataLoader implementations

4. **Session Issues**:
   - Clear browser cookies
   - Check session storage implementation
   - Verify cookie settings

### Debug Commands

```bash
# Check PostgreSQL connection
psql -h localhost -U postgres -d spa_demo

# Test GraphQL endpoint
curl -X POST http://localhost:4567/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ threads { id title } }"}'

# Test REST endpoint
curl http://localhost:4567/api/threads

# Check server logs
tail -f server.log
```
