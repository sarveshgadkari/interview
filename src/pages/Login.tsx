import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const { session, profile, loading } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  if (!loading && session && profile) {
    const dest = profile.role === 'manager' ? '/manager' : '/interview'
    return <Navigate to={dest} replace />
  }

  const onSubmit = async (values: LoginForm) => {
    setAuthError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    setSubmitting(false)
    if (error) setAuthError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-semibold text-cream">
            Panel
          </h1>
          <p className="text-cream-dim text-sm mt-1">
            Interview management, internal access only
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="panel-card p-6 space-y-4"
        >
          <div>
            <label className="panel-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="panel-input"
              placeholder="you@institute.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="panel-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="panel-input"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && (
              <p className="text-danger text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {authError && (
            <div className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-[10px] px-3 py-2">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-cream-dim mt-6">
          Accounts are provisioned by your administrator.
        </p>
      </div>
    </div>
  )
}
