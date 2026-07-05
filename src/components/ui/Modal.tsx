import type { ReactNode } from 'react'

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto py-8 px-4">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative panel-card w-full ${maxWidth} p-6 bg-charcoal-card`}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display text-cream">{title}</h2>
          <button
            onClick={onClose}
            className="btn-ghost"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
