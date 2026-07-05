export default function ScoreSelector({
  value,
  onChange,
  max = 5,
}: {
  value: number
  onChange: (score: number) => void
  max?: number
}) {
  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: max + 1 }, (_, score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          className={`h-7 w-7 rounded-[8px] text-xs font-mono font-medium transition-colors ${
            value === score
              ? 'bg-amber text-charcoal'
              : 'bg-charcoal-raised text-cream-dim border border-border-soft hover:border-amber/50 hover:text-cream'
          }`}
        >
          {score}
        </button>
      ))}
    </div>
  )
}
