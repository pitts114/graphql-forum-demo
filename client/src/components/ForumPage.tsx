import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { Link } from 'react-router-dom'
import { GET_THREADS, CREATE_THREAD } from '../apollo/queries'

interface Thread {
  id: string
  title: string
  content: string
  createdAt: string
  commentCount: number
  user: {
    id: string
    username: string
  }
}

export default function ForumPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const { data, loading, error } = useQuery<{ threads: Thread[] }>(GET_THREADS)
  const [createThread, { loading: createLoading }] = useMutation(CREATE_THREAD, {
    refetchQueries: [{ query: GET_THREADS }],
  })

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    try {
      await createThread({ variables: { title, content } })
      setTitle('')
      setContent('')
      setShowCreateForm(false)
    } catch (err) {
      console.error('Error creating thread:', err)
    }
  }

  if (loading) return <div>Loading threads...</div>
  if (error) return <div>Error loading threads: {error.message}</div>

  const threads: Thread[] = data?.threads || []

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '0 20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1>Forum</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
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
        <div style={{
          backgroundColor: '#1e1e1eff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3>Create New Thread</h3>
          <form onSubmit={handleCreateThread}>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="title" style={{ display: 'block', marginBottom: '5px' }}>
                Title:
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={createLoading}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label htmlFor="content" style={{ display: 'block', marginBottom: '5px' }}>
                Content:
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                disabled={createLoading}
                rows={5}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={createLoading || !title.trim() || !content.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: createLoading ? '#ccc' : '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: createLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {createLoading ? 'Creating...' : 'Create Thread'}
            </button>
          </form>
        </div>
      )}

      <div>
        {threads.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#151515ff',
            borderRadius: '8px'
          }}>
            <p>No threads yet. Be the first to create one!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <div
              key={thread.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <Link
                  to={`/forum/thread/${thread.id}`}
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    color: '#1976d2'
                  }}
                >
                  {thread.title}
                </Link>
              </div>
              <div style={{
                color: '#666',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                by {thread.user.username} • {new Date(thread.createdAt).toLocaleDateString()} • {thread.commentCount} comments
              </div>
              <div style={{
                color: '#333',
                lineHeight: '1.5'
              }}>
                {thread.content.length > 200
                  ? `${thread.content.substring(0, 200)}...`
                  : thread.content
                }
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
