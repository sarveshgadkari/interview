import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { UserRole } from '../types/database'
import Spinner from './ui/Spinner'

export default function ProtectedRoute({
  allow,
  children,
}: {
  allow: UserRole
  children: ReactNode
}) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-cream-dim text-sm">
        No profile found for this account. Ask an admin to set your role.
      </div>
    )
  }

  if (profile.role !== allow) {
    const dest = profile.role === 'manager' ? '/manager' : '/interview'
    return <Navigate to={dest} replace />
  }

  return <>{children}</>
}
