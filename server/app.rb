require 'sinatra/base'
require 'pg'
require 'bcrypt'
require 'json'
require 'rack/cors'
require_relative 'graphql_schema'

class App < Sinatra::Base
  configure do
    enable :sessions
    set :session_secret, ENV.fetch('SESSION_SECRET') { 'dev_secret_key_change_in_production_this_needs_to_be_at_least_64_bytes_long_for_security' }
    
    use Rack::Cors do
      allow do
        origins(/localhost:\d+/)
        resource '*', 
          methods: [:get, :post, :put, :delete, :options],
          headers: :any,
          credentials: true
      end
    end
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
    def current_user_id
      session[:user_id]
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
      session[:user_id] = user_id
      json(message: 'User created successfully', user: { id: user_id, username: username })
    rescue PG::Error
      halt 500, json(error: 'Failed to create user')
    end
  end

  post '/login' do
    data = JSON.parse(request.body.read)
    username = data['username']
    password = data['password']

    if username.nil? || username.empty? || password.nil? || password.empty?
      halt 400, json(error: 'Username and password are required')
    end

    user = find_user_by_username(username)
    if user && verify_password(password, user['password'])
      session[:user_id] = user['id']
      json(message: 'Login successful', user: { id: user['id'], username: user['username'] })
    else
      halt 401, json(error: 'Invalid username or password')
    end
  end

  post '/logout' do
    session.clear
    json(message: 'Logged out successfully')
  end

  get '/profile' do
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

  post '/graphql' do
    request_body = request.body.read
    variables = {}
    query = ""
    
    if request_body && !request_body.empty?
      data = JSON.parse(request_body)
      query = data['query']
      variables = data['variables'] || {}
    end

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