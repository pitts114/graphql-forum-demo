import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loginUser, registerUser, clearError } from '../store/authSlice'

export default function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      return
    }

    try {
      if (isRegistering) {
        await dispatch(registerUser({ username, password })).unwrap()
      } else {
        await dispatch(loginUser({ username, password })).unwrap()
      }
    } catch {
      // Error handling is managed by Redux state
    }
  }

  const toggleMode = () => {
    setIsRegistering(!isRegistering)
    dispatch(clearError())
    setUsername('')
    setPassword('')
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          backgroundColor: '#ffebee', 
          padding: '10px', 
          marginBottom: '20px',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
            Username:
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password:
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !username.trim() || !password.trim()}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Loading...' : (isRegistering ? 'Register' : 'Login')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
        {' '}
        <button
          type="button"
          onClick={toggleMode}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#1976d2',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          {isRegistering ? 'Login' : 'Register'}
        </button>
      </p>
    </div>
  )
}