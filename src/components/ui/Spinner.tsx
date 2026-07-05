export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-5 w-5 rounded-full border-2 border-border-soft border-t-amber animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  )
}
