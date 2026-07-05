export default function StatCard({
  label,
  value,
  accent = 'text-cream',
}: {
  label: string
  value: string | number
  accent?: string
}) {
  return (
    <div className="panel-card p-5">
      <p className="text-xs uppercase tracking-wide text-cream-dim">
        {label}
      </p>
      <p className={`font-mono text-3xl mt-2 ${accent}`}>{value}</p>
    </div>
  )
}
