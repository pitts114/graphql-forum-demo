require 'set'

class UserSource < GraphQL::Dataloader::Source
  def initialize(db)
    @db = db
  end

  def fetch(user_ids)
    # Build parameterized query
    placeholders = user_ids.map.with_index { |_, i| "$#{i + 1}" }.join(',')
    users_result = @db.exec_params("SELECT * FROM users WHERE id IN (#{placeholders})", user_ids)
    
    # Create hash lookup by user ID
    users_by_id = {}
    users_result.each do |user|
      users_by_id[user['id']] = user
    end

    # Return results in the same order as requested IDs, nil for missing users
    user_ids.map { |user_id| users_by_id[user_id.to_s] }
  end
end

class CommentsByThreadSource < GraphQL::Dataloader::Source
  def initialize(db)
    @db = db
  end

  def fetch(thread_ids)
    # Build parameterized query
    placeholders = thread_ids.map.with_index { |_, i| "$#{i + 1}" }.join(',')
    comments_result = @db.exec_params("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.thread_id IN (#{placeholders}) ORDER BY c.created_at ASC", thread_ids)
    
    # Group comments by thread_id
    comments_by_thread = {}
    comments_result.each do |comment|
      thread_id = comment['thread_id']
      comments_by_thread[thread_id] ||= []
      # Add user data to comment object
      comment_with_user = comment.merge('user' => { 'id' => comment['user_id'], 'username' => comment['username'] })
      comments_by_thread[thread_id] << comment_with_user
    end

    # Return results in the same order as requested thread IDs
    thread_ids.map { |thread_id| comments_by_thread[thread_id.to_s] || [] }
  end
end

class LikesByCommentSource < GraphQL::Dataloader::Source
  def initialize(db)
    @db = db
  end

  def fetch(comment_ids)
    # Build parameterized query
    placeholders = comment_ids.map.with_index { |_, i| "$#{i + 1}" }.join(',')
    likes_result = @db.exec_params("SELECT l.*, u.username FROM likes l JOIN users u ON l.user_id = u.id WHERE l.comment_id IN (#{placeholders})", comment_ids)
    
    # Group likes by comment_id
    likes_by_comment = {}
    likes_result.each do |like|
      comment_id = like['comment_id']
      likes_by_comment[comment_id] ||= []
      # Add user data to like object
      like_with_user = like.merge('user' => { 'id' => like['user_id'], 'username' => like['username'] })
      likes_by_comment[comment_id] << like_with_user
    end

    # Return results in the same order as requested comment IDs
    comment_ids.map { |comment_id| likes_by_comment[comment_id.to_s] || [] }
  end
end

class LikesCountSource < GraphQL::Dataloader::Source
  def initialize(db)
    @db = db
  end

  def fetch(comment_ids)
    # Build parameterized query
    placeholders = comment_ids.map.with_index { |_, i| "$#{i + 1}" }.join(',')
    counts_result = @db.exec_params("SELECT comment_id, COUNT(*) as count FROM likes WHERE comment_id IN (#{placeholders}) GROUP BY comment_id", comment_ids)
    
    # Create hash lookup by comment ID
    counts_by_comment = {}
    counts_result.each do |row|
      counts_by_comment[row['comment_id']] = row['count'].to_i
    end

    # Return results in the same order as requested comment IDs
    comment_ids.map { |comment_id| counts_by_comment[comment_id.to_s] || 0 }
  end
end

class UserLikesSource < GraphQL::Dataloader::Source
  def initialize(db, current_user_id)
    @db = db
    @current_user_id = current_user_id
  end

  def fetch(comment_ids)
    return comment_ids.map { false } unless @current_user_id

    # Build parameterized query 
    placeholders = comment_ids.map.with_index { |_, i| "$#{i + 1}" }.join(',')
    params = comment_ids + [@current_user_id]
    likes_result = @db.exec_params("SELECT comment_id FROM likes WHERE comment_id IN (#{placeholders}) AND user_id = $#{comment_ids.length + 1}", params)
    
    # Create set of liked comment IDs
    liked_comment_ids = Set.new
    likes_result.each do |row|
      liked_comment_ids.add(row['comment_id'])
    end

    # Return boolean results in the same order as requested comment IDs
    comment_ids.map { |comment_id| liked_comment_ids.include?(comment_id.to_s) }
  end
end