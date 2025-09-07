import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchProfile } from '../store/authSlice'

interface PrivateRouteProps {
  children: ReactNode
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { isAuthenticated, loading, user, profileCheckAttempted } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!isAuthenticated && !loading && !user && !profileCheckAttempted) {
      dispatch(fetchProfile())
    }
  }, [dispatch, isAuthenticated, loading, user, profileCheckAttempted])

  useEffect(() => {
    if (profileCheckAttempted && !isAuthenticated && !loading) {
      navigate('/', { replace: true })
    }
  }, [profileCheckAttempted, isAuthenticated, loading, navigate])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Redirecting to login...</div>
      </div>
    )
  }

  return <>{children}</>
}