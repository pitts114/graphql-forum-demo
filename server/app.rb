require 'sinatra/base'
require 'pg'
require 'bcrypt'
require 'json'
require 'rack/cors'
require 'securerandom'
require_relative 'graphql_schema'

class App < Sinatra::Base
  # Configure CORS
  use Rack::Cors do
    allow do
      origins 'http://localhost:5173'
      resource '*', 
        methods: [:get, :post, :put, :delete, :options],
        headers: :any,
        credentials: true
    end
  end

  configure do
    # Use simple in-memory session store for development
    @@sessions = {}
  end

  def initialize
    super
    setup_database
  end

  def setup_database
    @db = PG.connect(
      host: ENV['DB_HOST'] || 'localhost',
      port: ENV['DB_PORT'] || 5432,
      user: ENV['DB_USER'] || 'postgres',
      password: ENV['DB_PASSWORD'] || 'password',
      dbname: ENV['DB_NAME'] || 'spa_demo'
    )
    
    create_users_table
    create_forum_tables
  rescue PG::Error => e
    puts "Database connection failed: #{e.message}"
    puts "Make sure PostgreSQL is running and the database exists"
  end

  def create_users_table
    @db.exec(<<~SQL)
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    SQL
    
    @db.exec("CREATE INDEX IF NOT EXISTS idx_username ON users(username)")
  end

  def create_forum_tables
    @db.exec(<<~SQL)
      CREATE TABLE IF NOT EXISTS threads (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    SQL

    @db.exec(<<~SQL)
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        thread_id INTEGER REFERENCES threads(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    SQL

    @db.exec(<<~SQL)
      CREATE TABLE IF NOT EXISTS likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    SQL

    @db.exec("CREATE INDEX IF NOT EXISTS idx_thread_user ON threads(user_id)")
    @db.exec("CREATE INDEX IF NOT EXISTS idx_comment_thread ON comments(thread_id)")
    @db.exec("CREATE INDEX IF NOT EXISTS idx_comment_user ON comments(user_id)")
    @db.exec("CREATE INDEX IF NOT EXISTS idx_like_comment ON likes(comment_id)")
    @db.exec("CREATE INDEX IF NOT EXISTS idx_like_user ON likes(user_id)")
  end

  helpers do
    def get_session_id
      request.cookies['spa_session_id']
    end

    def create_session(user_id)
      session_id = SecureRandom.hex(32)
      @@sessions[session_id] = { user_id: user_id, created_at: Time.now }
      response.set_cookie('spa_session_id', 
        value: session_id, 
        path: '/', 
        httponly: false, 
        secure: false,
        max_age: 86400 * 30 # 30 days
      )
      session_id
    end

    def clear_session
      session_id = get_session_id
      @@sessions.delete(session_id) if session_id
      response.set_cookie('spa_session_id', 
        value: '', 
        path: '/', 
        expires: Time.now - 1
      )
    end

    def current_user_id
      session_id = get_session_id
      return nil unless session_id
      session_data = @@sessions[session_id]
      return nil unless session_data
      session_data[:user_id]
    end

    def authenticated?
      !current_user_id.nil?
    end

    def require_authentication
      halt 401, json(error: 'Authentication required') unless authenticated?
    end

    def json(data)
      content_type :json
      data.to_json
    end

    def find_user_by_username(username)
      result = @db.exec_params("SELECT * FROM users WHERE username = $1 LIMIT 1", [username])
      result.first
    end

    def find_user_by_id(id)
      result = @db.exec_params("SELECT * FROM users WHERE id = $1 LIMIT 1", [id])
      result.first
    end

    def create_user(username, password)
      hashed_password = BCrypt::Password.create(password)
      result = @db.exec_params("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id", [username, hashed_password])
      result.first['id'].to_i
    end

    def verify_password(password, hashed_password)
      BCrypt::Password.new(hashed_password) == password
    end

    def update_user_password(user_id, new_password)
      hashed_password = BCrypt::Password.create(new_password)
      @db.exec_params("UPDATE users SET password = $1 WHERE id = $2", [hashed_password, user_id])
    end
  end

  post '/register' do
    data = JSON.parse(request.body.read)
    username = data['username']
    password = data['password']

    if username.nil? || username.empty? || password.nil? || password.empty?
      halt 400, json(error: 'Username and password are required')
    end

    if find_user_by_username(username)
      halt 409, json(error: 'Username already exists')
    end

    begin
      user_id = create_user(username, password)
      create_session(user_id)
      json(message: 'User created successfully', user: { id: user_id, username: username })
    rescue PG::Error
      halt 500, json(error: 'Failed to create user')
    end
  end

  post '/login' do
    data = JSON.parse(request.body.read)
    username = data['username']
    password = data['password']

    puts "Login attempt - Username: #{username}"
    puts "Login attempt - Session before: #{session.inspect}"

    if username.nil? || username.empty? || password.nil? || password.empty?
      halt 400, json(error: 'Username and password are required')
    end

    user = find_user_by_username(username)
    puts "Login attempt - User found: #{user ? user['id'] : 'nil'}"
    
    if user && verify_password(password, user['password'])
      puts "Login attempt - Password verified, creating session"
      create_session(user['id'])
      puts "Login attempt - Current user_id check: #{current_user_id}"
      json(message: 'Login successful', user: { id: user['id'], username: user['username'] })
    else
      puts "Login attempt - Failed: user=#{!!user}, password_valid=#{user ? verify_password(password, user['password']) : false}"
      halt 401, json(error: 'Invalid username or password')
    end
  end

  post '/logout' do
    clear_session
    json(message: 'Logged out successfully')
  end

  get '/profile' do
    # Debug: Log session info
    puts "Profile request - Session user_id: #{current_user_id}"
    puts "Profile request - Session data: #{session.inspect}"
    puts "Profile request - Headers: #{request.env.select { |k,v| k.match(/HTTP_/) }}"
    
    require_authentication
    
    user = find_user_by_id(current_user_id)
    if user
      json(user: { id: user['id'], username: user['username'] })
    else
      halt 404, json(error: 'User not found')
    end
  end

  put '/profile' do
    require_authentication
    
    data = JSON.parse(request.body.read)
    new_password = data['password']

    if new_password.nil? || new_password.empty?
      halt 400, json(error: 'Password is required')
    end

    begin
      update_user_password(current_user_id, new_password)
      json(message: 'Password updated successfully')
    rescue PG::Error
      halt 500, json(error: 'Failed to update password')
    end
  end

  # Debug endpoint to check session state
  get '/debug/session' do
    session_id = get_session_id
    session_data = session_id ? @@sessions[session_id] : nil
    
    json({
      session_id: session_id,
      session_data: session_data,
      user_id: current_user_id,
      authenticated: authenticated?,
      all_sessions: @@sessions.keys.length,
      request_cookies: request.cookies
    })
  end

  # Debug endpoint to check users in database
  get '/debug/users' do
    users_result = @db.exec("SELECT id, username, created_at FROM users ORDER BY created_at DESC")
    users = users_result.map { |user| { id: user['id'], username: user['username'], created_at: user['created_at'] } }
    json({ users: users, count: users.length })
  end

  post '/graphql' do
    request_body = request.body.read
    variables = {}
    query = ""
    
    if request_body && !request_body.empty?
      data = JSON.parse(request_body)
      query = data['query']
      variables = data['variables'] || {}
    end

    # Debug: Log current session info
    puts "GraphQL request - Session user_id: #{current_user_id}"
    puts "GraphQL request - Session data: #{session.inspect}"

    result = ForumSchema.execute(
      query,
      variables: variables,
      context: {
        db: @db,
        current_user_id: current_user_id
      }
    )

    json(result)
  end

  options '*' do
    200
  end

  not_found do
    json(error: 'Not found')
  end

  error do
    json(error: 'Internal server error')
  end
end