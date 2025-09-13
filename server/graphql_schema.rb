require 'graphql'
require_relative 'loaders'

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
    # Check if user data is pre-loaded from JOIN, otherwise use loader
    object[:user] || dataloader.with(UserSource, context[:db]).load(object['user_id'])
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
    dataloader.with(UserSource, context[:db]).load(object['user_id'])
  end

  def likes
    []
  end

  def likes_count
    0
  end

  def is_liked_by_current_user
    false
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
    dataloader.with(UserSource, context[:db]).load(object['user_id'])
  end

  def comments
    dataloader.with(CommentsByThreadSource, context[:db]).load(object['id'])
  end

  def comment_count
    # For now, we'll use a simple query since count is just one value
    # Could be optimized with another loader if needed
    context[:db].exec_params("SELECT COUNT(*) as count FROM comments WHERE thread_id = $1", [object['id']]).first['count'].to_i
  end
end

class QueryType < GraphQL::Schema::Object
  field :threads, [ThreadType], null: false, description: "Get all threads"
  field :thread, ThreadType, null: true do
    argument :id, ID, required: true
  end

  def threads
    threads_result = context[:db].exec("SELECT * FROM threads ORDER BY created_at DESC")
    threads_result.to_a
  end

  def thread(id:)
    thread_result = context[:db].exec_params("SELECT * FROM threads WHERE id = $1", [id])
    return nil if thread_result.ntuples == 0
    thread_result.first
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

    result.first
  end

  def create_comment(thread_id:, content:)
    raise GraphQL::ExecutionError, "Authentication required" unless context[:current_user_id]

    result = context[:db].exec_params(
      "INSERT INTO comments (content, thread_id, user_id) VALUES ($1, $2, $3) RETURNING *",
      [content, thread_id, context[:current_user_id]]
    )

    result.first
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
  use GraphQL::Dataloader
end
