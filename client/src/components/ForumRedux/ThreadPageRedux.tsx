import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  useGetThreadQuery,
  useCreateCommentMutation,
  useToggleLikeMutation,
  type Comment,
  type Thread
} from '../../store/forumApi'

export default function ThreadPageRedux() {
  const { id } = useParams<{ id: string }>()
  const [newComment, setNewComment] = useState('')

  // RTK Query hooks
  const { data, isLoading, error } = useGetThreadQuery(id!, { skip: !id })
  const [createComment, { isLoading: createLoading }] = useCreateCommentMutation()
  const [toggleLike, { isLoading: likeLoading }] = useToggleLikeMutation()

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !id) return

    try {
      await createComment({ threadId: id, content: newComment }).unwrap()
      setNewComment('')
    } catch (err) {
      console.error('Error creating comment:', err)
    }
  }

  const handleToggleLike = async (commentId: string) => {
    try {
      await toggleLike(commentId).unwrap()
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  if (!id) return <div>Thread ID not provided</div>
  if (isLoading) return <div>Loading thread...</div>
  if (error) return <div>Error loading thread: {'message' in error ? error.message : 'Unknown error'}</div>
  if (!data?.thread) return <div>Thread not found</div>

  const thread: Thread = data.thread

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/forum_redux"
          style={{
            textDecoration: 'none',
            color: '#007bff',
            fontSize: '14px'
          }}
        >
          ← Back to Forum (Redux)
        </Link>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 15px 0', color: '#333' }}>{thread.title}</h1>
        <p style={{
          margin: '0 0 15px 0',
          lineHeight: '1.6',
          color: '#555'
        }}>
          {thread.content}
        </p>
        <div style={{
          fontSize: '12px',
          color: '#888',
          borderTop: '1px solid #eee',
          paddingTop: '10px'
        }}>
          By {thread.user.username} • {new Date(thread.createdAt).toLocaleString()}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>
          Comments ({thread.comments?.length || 0})
        </h3>

        <form onSubmit={handleCreateComment} style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '10px'
            }}
          />
          <button
            type="submit"
            disabled={createLoading || !newComment.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: createLoading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {createLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>

      <div>
        {thread.comments && thread.comments.length > 0 ? (
          thread.comments.map((comment: Comment) => (
            <div key={comment.id} style={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <p style={{
                margin: '0 0 10px 0',
                lineHeight: '1.5',
                color: '#333'
              }}>
                {comment.content}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#888'
              }}>
                <span>By {comment.user.username} • {new Date(comment.createdAt).toLocaleString()}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleLike(comment.id)}
                    disabled={likeLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: likeLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: comment.isLikedByCurrentUser ? '#e74c3c' : '#6c757d',
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {comment.isLikedByCurrentUser ? '❤️' : '🤍'} {comment.likesCount}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>

      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0,123,255,0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        🔄 Redux + REST
      </div>
    </div>
  )
}