import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logoutUser } from '../store/authSlice'

export default function ProfileView() {
  const dispatch = useAppDispatch()
  const { user, loading } = useAppSelector((state) => state.auth)

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (!user) {
    return <div>Loading user information...</div>
  }

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Profile</h1>

      <div style={{
        backgroundColor: '#2b2b2bff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginTop: 0 }}>User Information</h3>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Username:</strong> {user.username}</p>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </div>
  )
}
