import { useEffect, type ReactNode } from 'react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { fetchProfile } from '../store/authSlice'

interface PrivateRouteProps {
  children: ReactNode
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const dispatch = useAppDispatch()
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (!isAuthenticated && !loading && !user) {
      dispatch(fetchProfile())
    }
  }, [dispatch, isAuthenticated, loading, user])

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
    return null
  }

  return <>{children}</>
}