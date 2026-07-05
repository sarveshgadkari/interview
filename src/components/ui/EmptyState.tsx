import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="panel-card flex flex-col items-center justify-center text-center py-14 px-6">
      <h3 className="text-cream font-display text-lg">{title}</h3>
      {description && (
        <p className="text-cream-dim text-sm mt-1.5 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
