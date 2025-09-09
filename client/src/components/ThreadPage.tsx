import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_THREAD, CREATE_COMMENT, TOGGLE_LIKE } from '../apollo/queries'

interface Comment {
  id: string
  content: string
  createdAt: string
  likesCount: number
  isLikedByCurrentUser: boolean
  user: {
    id: string
    username: string
  }
}

interface Thread {
  id: string
  title: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
  }
  comments: Comment[]
}

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>()
  const [newComment, setNewComment] = useState('')

  const { data, loading, error } = useQuery<{ thread: Thread | null }>(GET_THREAD, {
    variables: { id },
    skip: !id
  })

  const [createComment, { loading: createLoading }] = useMutation(CREATE_COMMENT, {
    refetchQueries: [{ query: GET_THREAD, variables: { id } }],
  })

  const [toggleLike] = useMutation(TOGGLE_LIKE, {
    refetchQueries: [{ query: GET_THREAD, variables: { id } }],
  })

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !id) return

    try {
      await createComment({ 
        variables: { 
          threadId: id, 
          content: newComment 
        } 
      })
      setNewComment('')
    } catch (err) {
      console.error('Error creating comment:', err)
    }
  }

  const handleToggleLike = async (commentId: string) => {
    try {
      await toggleLike({ variables: { commentId } })
    } catch (err) {
      console.error('Error toggling like:', err)
    }
  }

  if (loading) return <div>Loading thread...</div>
  if (error) return <div>Error loading thread: {error.message}</div>
  if (!data?.thread) return <div>Thread not found</div>

  const thread: Thread = data.thread

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/forum" style={{ color: '#1976d2', textDecoration: 'none' }}>
          ← Back to Forum
        </Link>
      </div>

      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '10px', color: '#333' }}>{thread.title}</h1>
        <div style={{
          color: '#666',
          fontSize: '14px',
          marginBottom: '15px'
        }}>
          by {thread.user.username} • {new Date(thread.createdAt).toLocaleDateString()}
        </div>
        <div style={{
          color: '#333',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap'
        }}>
          {thread.content}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Add a Comment</h3>
        <form onSubmit={handleCreateComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            disabled={createLoading}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical',
              marginBottom: '10px'
            }}
          />
          <button
            type="submit"
            disabled={createLoading || !newComment.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: createLoading ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {createLoading ? 'Adding Comment...' : 'Add Comment'}
          </button>
        </form>
      </div>

      <div>
        <h3>Comments ({thread.comments.length})</h3>
        {thread.comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          thread.comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                color: '#666',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                {comment.user.username} • {new Date(comment.createdAt).toLocaleDateString()}
              </div>
              <div style={{
                color: '#333',
                lineHeight: '1.5',
                marginBottom: '10px',
                whiteSpace: 'pre-wrap'
              }}>
                {comment.content}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => handleToggleLike(comment.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: comment.isLikedByCurrentUser ? '#f44336' : '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    padding: '5px'
                  }}
                >
                  <span style={{ marginRight: '5px' }}>
                    {comment.isLikedByCurrentUser ? '❤️' : '🤍'}
                  </span>
                  {comment.likesCount}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}