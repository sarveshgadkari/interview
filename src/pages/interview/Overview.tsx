import { useNavigate } from 'react-router-dom'
import { useTrainers } from '../../hooks/useTrainers'
import { useTrainerSession } from '../../contexts/TrainerSessionContext'
import { useOverviewStats } from '../../hooks/useOverviewStats'
import { useStudents } from '../../hooks/useStudents'
import StatCard from '../../components/ui/StatCard'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/format'

export default function Overview() {
  const navigate = useNavigate()
  const { trainers } = useTrainers()
  const { activeTrainerId, setActiveTrainerId } = useTrainerSession()
  const { stats, loading } = useOverviewStats(activeTrainerId)
  const { students: awaiting, loading: awaitingLoading } = useStudents({
    status: 'New',
  })

  const activeTrainerName = trainers.find((t) => t.id === activeTrainerId)?.name

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl text-cream">Overview</h1>
          <p className="text-cream-dim text-sm mt-1">
            A snapshot of interview activity across all tracks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-cream-dim uppercase tracking-wide">
            You are
          </label>
          <select
            className="panel-input w-auto"
            value={activeTrainerId ?? ''}
            onChange={(e) => setActiveTrainerId(e.target.value || null)}
          >
            <option value="">Select trainer…</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Students" value={stats?.totalStudents ?? 0} />
          <StatCard
            label="Interviews Taken"
            value={stats?.interviewsTaken ?? 0}
            accent="text-teal"
          />
          <StatCard
            label="Awaiting Interview"
            value={stats?.awaitingInterview ?? 0}
            accent="text-amber"
          />
          <StatCard
            label={
              activeTrainerName
                ? `${activeTrainerName}'s Interviews`
                : 'Your Interviews'
            }
            value={stats?.trainerInterviews ?? 0}
            accent="text-teal"
          />
        </div>
      )}

      <h2 className="text-lg text-cream mb-3">Awaiting Interview</h2>
      {awaitingLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : awaiting.length === 0 ? (
        <EmptyState
          title="Nobody's waiting"
          description="Every student has been interviewed at least once."
        />
      ) : (
        <div className="panel-card divide-y divide-border-soft">
          {awaiting.slice(0, 8).map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-cream font-medium">{s.name}</p>
                <p className="text-xs text-cream-dim mt-0.5">
                  {s.interview_types?.name ?? 'Unassigned'} · Applied{' '}
                  {formatDate(s.applied_date)}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() =>
                  navigate(`/interview/students/${s.id}/start-interview`)
                }
                type="button"
              >
                Start Interview
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
