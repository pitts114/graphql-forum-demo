import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetThreadsQuery, useCreateThreadMutation, type Thread } from '../../store/forumApi'

export default function ForumPageRedux() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // RTK Query hooks for data fetching
  const { data, isLoading, error } = useGetThreadsQuery()
  const [createThread, { isLoading: createLoading }] = useCreateThreadMutation()

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    try {
      await createThread({ title, content }).unwrap()
      setTitle('')
      setContent('')
      setShowCreateForm(false)
    } catch (err) {
      console.error('Error creating thread:', err)
    }
  }

  if (isLoading) return <div>Loading threads...</div>
  if (error) return <div>Error loading threads: {'message' in error ? error.message : 'Unknown error'}</div>

  const threads: Thread[] = data?.threads || []

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px 0',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <h1 style={{ margin: 0, color: '#333' }}>Forum (Redux + REST)</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showCreateForm ? 'Cancel' : 'Create Thread'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateThread} style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Thread title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <textarea
              placeholder="Thread content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={createLoading || !title.trim() || !content.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: createLoading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: createLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {createLoading ? 'Creating...' : 'Create Thread'}
          </button>
        </form>
      )}

      <div>
        {threads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No threads yet. Create the first one!
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: 'white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
                <Link
                  to={`/forum_redux/${thread.id}`}
                  style={{
                    textDecoration: 'none',
                    color: '#007bff',
                    fontSize: '18px'
                  }}
                >
                  {thread.title}
                </Link>
              </h3>
              <p style={{
                margin: '0 0 10px 0',
                color: '#666',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {thread.content.length > 200
                  ? `${thread.content.substring(0, 200)}...`
                  : thread.content
                }
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#888'
              }}>
                <span>By {thread.user.username}</span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <span>{thread.commentCount} comments</span>
                  <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
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