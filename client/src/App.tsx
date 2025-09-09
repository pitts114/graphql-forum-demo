import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAppSelector } from './store/hooks'
import LoginForm from './components/LoginForm'
import ProfileView from './components/ProfileView'
import ForumPage from './components/ForumPage'
import ThreadPage from './components/ThreadPage'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  return (
    <Router>
      <div className="App">
        {isAuthenticated && (
          <nav style={{
            backgroundColor: '#1976d2',
            padding: '15px 20px',
            marginBottom: '0'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '20px' }}>
              <Link 
                to="/forum" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Forum
              </Link>
              <Link 
                to="/profile" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                Profile
              </Link>
            </div>
          </nav>
        )}
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/forum" replace /> : <LoginForm />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <ProfileView />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/forum" 
            element={
              <PrivateRoute>
                <ForumPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/forum/thread/:id" 
            element={
              <PrivateRoute>
                <ThreadPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
