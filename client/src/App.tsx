import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppSelector } from './store/hooks'
import LoginForm from './components/LoginForm'
import ProfileView from './components/ProfileView'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  const { isAuthenticated } = useAppSelector((state) => state.auth)

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/profile" replace /> : <LoginForm />
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
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
