import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TrainerSessionProvider } from './contexts/TrainerSessionContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Login from './pages/Login'
import Overview from './pages/interview/Overview'
import InterviewTypes from './pages/interview/InterviewTypes'
import QuestionBank from './pages/interview/QuestionBank'
import Students from './pages/interview/Students'
import Trainers from './pages/interview/Trainers'
import StartInterview from './pages/interview/StartInterview'
import InterviewHistory from './pages/interview/InterviewHistory'
import Reports from './pages/manager/Reports'
import StudentDetail from './pages/manager/StudentDetail'
import Spinner from './components/ui/Spinner'

function RootRedirect() {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  const dest = profile?.role === 'manager' ? '/manager' : '/interview'
  return <Navigate to={dest} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TrainerSessionProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/interview"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <Overview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/types"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <InterviewTypes />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/questions"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <QuestionBank />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/students"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <Students />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/trainers"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <Trainers />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/history"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <InterviewHistory />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/students/:studentId/start-interview"
              element={
                <ProtectedRoute allow="admin_interviewer">
                  <DashboardLayout role="interview">
                    <StartInterview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/manager"
              element={
                <ProtectedRoute allow="manager">
                  <DashboardLayout role="manager">
                    <Reports />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/students/:studentId"
              element={
                <ProtectedRoute allow="manager">
                  <DashboardLayout role="manager">
                    <StudentDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </TrainerSessionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
