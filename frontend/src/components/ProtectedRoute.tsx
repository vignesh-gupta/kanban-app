import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../store'
import { loginSuccess, logout } from '../store/slices/authSlice'
import { socketService } from '../services/socket'
import api from '../services/api'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()

  useEffect(() => {
    const verifyToken = async () => {
      if (token && !user) {
        try {
          const response = await api.get('/auth/me')
          dispatch(loginSuccess({ user: response.data, token }))
          socketService.connect(token)
        } catch (error) {
          dispatch(logout())
        }
      }
    }

    verifyToken()
  }, [token, user, dispatch])

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}