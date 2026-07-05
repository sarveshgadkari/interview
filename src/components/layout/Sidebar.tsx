import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

const interviewNav: NavItem[] = [
  { to: '/interview', label: 'Overview', end: true },
  { to: '/interview/types', label: 'Interview Types' },
  { to: '/interview/questions', label: 'Question Bank' },
  { to: '/interview/students', label: 'Students' },
  { to: '/interview/trainers', label: 'Trainers' },
  { to: '/interview/history', label: 'Interview History' },
]

const managerNav: NavItem[] = [{ to: '/manager', label: 'Reports', end: true }]

export default function Sidebar({
  role,
  onNavigate,
}: {
  role: 'interview' | 'manager'
  onNavigate?: () => void
}) {
  const { profile, signOut } = useAuth()
  const items = role === 'interview' ? interviewNav : managerNav

  return (
    <aside className="w-60 shrink-0 h-full sm:h-screen sm:sticky sm:top-0 border-r border-border-soft bg-charcoal-raised flex flex-col">
      <div className="px-5 py-6">
        <h1 className="text-2xl font-display text-cream">Panel</h1>
        <p className="text-xs text-cream-dim mt-0.5">
          {role === 'interview' ? 'Interview Dashboard' : 'Manager Dashboard'}
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber/15 text-amber'
                  : 'text-cream-dim hover:bg-charcoal-card hover:text-cream'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border-soft">
        <p className="text-sm text-cream truncate">
          {profile?.full_name || 'Signed in'}
        </p>
        <p className="text-xs text-cream-dim mb-3">
          {profile?.role === 'manager' ? 'Manager' : 'Interviewer'}
        </p>
        <button onClick={signOut} className="btn-secondary w-full" type="button">
          Logout
        </button>
      </div>
    </aside>
  )
}
