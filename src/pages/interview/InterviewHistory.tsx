import { useMemo, useState } from 'react'
import { useInterviews } from '../../hooks/useInterviews'
import { useInterviewTypes } from '../../hooks/useInterviewTypes'
import { useTrainers } from '../../hooks/useTrainers'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { formatDate, scorePercent, verdictStyles } from '../../utils/format'

export default function InterviewHistory() {
  const { types } = useInterviewTypes()
  const { trainers } = useTrainers()
  const activeTypes = useMemo(() => types.filter((t) => !t.archived), [types])

  const [typeFilter, setTypeFilter] = useState('')
  const [trainerFilter, setTrainerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { interviews, loading, error } = useInterviews({
    typeId: typeFilter,
    trainerId: trainerFilter,
    dateFrom,
    dateTo,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl text-cream">Interview History</h1>
        <p className="text-cream-dim text-sm mt-1">
          Every interview taken, across all trainers and tracks.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="panel-input w-auto"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          {activeTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          className="panel-input w-auto"
          value={trainerFilter}
          onChange={(e) => setTrainerFilter(e.target.value)}
        >
          <option value="">All trainers</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-cream-dim uppercase tracking-wide">
            From
          </label>
          <input
            type="date"
            className="panel-input w-auto"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-cream-dim uppercase tracking-wide">
            To
          </label>
          <input
            type="date"
            className="panel-input w-auto"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : interviews.length === 0 ? (
        <EmptyState
          title="No interviews found"
          description="Try clearing filters, or start an interview from the Students page."
        />
      ) : (
        <div className="panel-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-cream-dim text-xs uppercase tracking-wide border-b border-border-soft">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 font-medium">Trainer</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Score</th>
                <th className="px-5 py-3 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {interviews.map((i) => (
                <tr key={i.id}>
                  <td className="px-5 py-3 text-cream font-medium">
                    {i.students?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-cream-dim">
                    {i.interview_types?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-cream-dim">{i.interview_mode}</td>
                  <td className="px-5 py-3 text-cream-dim">
                    {i.trainers?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-mono text-cream-dim">
                    {formatDate(i.date)}
                  </td>
                  <td className="px-5 py-3 font-mono text-cream">
                    {scorePercent(i.total_score, i.max_score)}%
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={verdictStyles[i.verdict ?? '']}>
                      {i.verdict || 'No verdict'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
