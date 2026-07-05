import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function DashboardLayout({
  role,
  children,
}: {
  role: 'interview' | 'manager'
  children: ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen sm:flex">
      <header className="sm:hidden flex items-center justify-between px-4 py-4 border-b border-border-soft bg-charcoal-raised sticky top-0 z-30">
        <h1 className="text-xl font-display text-cream">Panel</h1>
        <button
          className="btn-secondary px-3 py-1.5"
          onClick={() => setDrawerOpen(true)}
          type="button"
          aria-label="Open menu"
        >
          Menu
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[80%]">
            <Sidebar role={role} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden sm:block">
        <Sidebar role={role} />
      </div>

      <main className="flex-1 min-w-0 px-4 py-6 sm:px-10 sm:py-8">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
