require 'graphql'

class UserType < GraphQL::Schema::Object
  field :id, ID, null: false
  field :username, String, null: false
  field :created_at, GraphQL::Types::ISO8601DateTime, null: false
end

class LikeType < GraphQL::Schema::Object
  field :id, ID, null: false
  field :user, UserType, null: false
  field :created_at, GraphQL::Types::ISO8601DateTime, null: false

  def user
    object[:user] || context[:db].exec_params("SELECT * FROM users WHERE id = $1", [object['user_id']]).first
  end
end

class CommentType < GraphQL::Schema::Object
  field :id, ID, null: false
  field :content, String, null: false
  field :user, UserType, null: false
  field :likes, [LikeType], null: false
  field :likes_count, Integer, null: false
  field :is_liked_by_current_user, Boolean, null: false
  field :created_at, GraphQL::Types::ISO8601DateTime, null: false

  def user
    object[:user] || context[:db].exec_params("SELECT * FROM users WHERE id = $1", [object['user_id']]).first
  end

  def likes
    likes_result = context[:db].exec_params("SELECT l.*, u.username FROM likes l JOIN users u ON l.user_id = u.id WHERE l.comment_id = $1", [object['id']])
    likes_result.map do |like|
      like.merge('user' => { 'id' => like['user_id'], 'username' => like['username'] })
    end
  end

  def likes_count
    context[:db].exec_params("SELECT COUNT(*) as count FROM likes WHERE comment_id = $1", [object['id']]).first['count'].to_i
  end

  def is_liked_by_current_user
    return false unless context[:current_user_id]
    
    result = context[:db].exec_params("SELECT 1 FROM likes WHERE comment_id = $1 AND user_id = $2", [object['id'], context[:current_user_id]])
    result.ntuples > 0
  end
end

class ThreadType < GraphQL::Schema::Object
  field :id, ID, null: false
  field :title, String, null: false
  field :content, String, null: false
  field :user, UserType, null: false
  field :comments, [CommentType], null: false
  field :comment_count, Integer, null: false
  field :created_at, GraphQL::Types::ISO8601DateTime, null: false

  def user
    object[:user] || context[:db].exec_params("SELECT * FROM users WHERE id = $1", [object['user_id']]).first
  end

  def comments
    comments_result = context[:db].exec_params("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.thread_id = $1 ORDER BY c.created_at ASC", [object['id']])
    comments_result.map do |comment|
      comment.merge('user' => { 'id' => comment['user_id'], 'username' => comment['username'] })
    end
  end

  def comment_count
    context[:db].exec_params("SELECT COUNT(*) as count FROM comments WHERE thread_id = $1", [object['id']]).first['count'].to_i
  end
end

class QueryType < GraphQL::Schema::Object
  field :threads, [ThreadType], null: false, description: "Get all threads"
  field :thread, ThreadType, null: true do
    argument :id, ID, required: true
  end

  def threads
    threads_result = context[:db].exec("SELECT t.*, u.username FROM threads t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC")
    threads_result.map do |thread|
      thread.merge('user' => { 'id' => thread['user_id'], 'username' => thread['username'] })
    end
  end

  def thread(id:)
    thread_result = context[:db].exec_params("SELECT t.*, u.username FROM threads t JOIN users u ON t.user_id = u.id WHERE t.id = $1", [id])
    return nil if thread_result.ntuples == 0
    
    thread_data = thread_result.first
    thread_data.merge('user' => { 'id' => thread_data['user_id'], 'username' => thread_data['username'] })
  end
end

class MutationType < GraphQL::Schema::Object
  field :create_thread, ThreadType, null: true do
    argument :title, String, required: true
    argument :content, String, required: true
  end

  field :create_comment, CommentType, null: true do
    argument :thread_id, ID, required: true
    argument :content, String, required: true
  end

  field :toggle_like, Boolean, null: false do
    argument :comment_id, ID, required: true
  end

  def create_thread(title:, content:)
    raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user_id]

    result = context[:db].exec_params(
      "INSERT INTO threads (title, content, user_id) VALUES ($1, $2, $3) RETURNING *",
      [title, content, context[:current_user_id]]
    )
    
    thread_data = result.first
    user_result = context[:db].exec_params("SELECT * FROM users WHERE id = $1", [thread_data['user_id']])
    thread_data.merge('user' => user_result.first)
  end

  def create_comment(thread_id:, content:)
    raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user_id]

    result = context[:db].exec_params(
      "INSERT INTO comments (content, thread_id, user_id) VALUES ($1, $2, $3) RETURNING *",
      [content, thread_id, context[:current_user_id]]
    )
    
    comment_data = result.first
    user_result = context[:db].exec_params("SELECT * FROM users WHERE id = $1", [comment_data['user_id']])
    comment_data.merge('user' => user_result.first)
  end

  def toggle_like(comment_id:)
    raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user_id]

    # Check if like already exists
    existing_like = context[:db].exec_params(
      "SELECT 1 FROM likes WHERE comment_id = $1 AND user_id = $2",
      [comment_id, context[:current_user_id]]
    )

    if existing_like.ntuples > 0
      # Remove like
      context[:db].exec_params(
        "DELETE FROM likes WHERE comment_id = $1 AND user_id = $2",
        [comment_id, context[:current_user_id]]
      )
      false
    else
      # Add like
      context[:db].exec_params(
        "INSERT INTO likes (comment_id, user_id) VALUES ($1, $2)",
        [comment_id, context[:current_user_id]]
      )
      true
    end
  end
end

class ForumSchema < GraphQL::Schema
  query QueryType
  mutation MutationType
end