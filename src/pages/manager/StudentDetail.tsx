import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStudentDetail } from '../../hooks/useStudentDetail'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import { formatDate, scorePercent, statusStyles, verdictStyles } from '../../utils/format'
import { exportStudentReportPdf } from '../../utils/pdfExport'

export default function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { student, interviews, loading, error } = useStudentDetail(studentId)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    if (!student) return
    setDownloading(true)
    try {
      exportStudentReportPdf(student, interviews)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (error || !student) {
    return <p className="text-danger text-sm">{error ?? 'Student not found.'}</p>
  }

  return (
    <div className="pb-16">
      <button
        className="btn-ghost mb-4"
        onClick={() => navigate('/manager')}
        type="button"
      >
        ← Back to Reports
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl text-cream">{student.name}</h1>
          <p className="text-cream-dim text-sm mt-1">
            {student.interview_types?.name ?? 'Unassigned'} ·{' '}
            {student.trainers?.name ?? 'Unassigned'} · Applied{' '}
            {formatDate(student.applied_date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusStyles[student.status]}>{student.status}</Badge>
          <button
            className="btn-primary"
            onClick={handleDownload}
            disabled={downloading}
            type="button"
          >
            {downloading ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="panel-card p-5 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-cream-dim text-xs uppercase tracking-wide">Email</p>
          <p className="text-cream mt-1">{student.email ?? '—'}</p>
        </div>
        <div>
          <p className="text-cream-dim text-xs uppercase tracking-wide">Phone</p>
          <p className="text-cream mt-1">{student.phone ?? '—'}</p>
        </div>
        <div>
          <p className="text-cream-dim text-xs uppercase tracking-wide">Mode</p>
          <p className="text-cream mt-1">{student.interview_mode}</p>
        </div>
        <div>
          <p className="text-cream-dim text-xs uppercase tracking-wide">Interviews</p>
          <p className="text-cream mt-1 font-mono">{interviews.length}</p>
        </div>
        {student.notes && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-cream-dim text-xs uppercase tracking-wide">Notes</p>
            <p className="text-cream mt-1">{student.notes}</p>
          </div>
        )}
      </div>

      <h2 className="text-lg text-cream mb-4">Interview History</h2>

      {interviews.length === 0 ? (
        <EmptyState
          title="No interviews yet"
          description="This student hasn't been interviewed."
        />
      ) : (
        <div className="space-y-5">
          {interviews.map((interview) => (
            <div key={interview.id} className="panel-card p-5">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <p className="text-cream font-display text-lg">
                    {formatDate(interview.date)} ·{' '}
                    {interview.interview_types?.name ?? 'Unassigned'}
                  </p>
                  <p className="text-xs text-cream-dim mt-1">
                    {interview.interview_mode} · Conducted by{' '}
                    {interview.trainers?.name ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cream text-sm">
                    {scorePercent(interview.total_score, interview.max_score)}%
                  </span>
                  <Badge className={verdictStyles[interview.verdict ?? '']}>
                    {interview.verdict || 'No verdict'}
                  </Badge>
                </div>
              </div>

              {(interview.marking_scores?.length ?? 0) > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                  {interview.marking_scores.map((m) => (
                    <div key={m.criterion}>
                      <p className="text-cream-dim text-xs uppercase tracking-wide">
                        {m.criterion}
                      </p>
                      <p className="text-cream font-mono mt-1">{m.score}/5</p>
                    </div>
                  ))}
                </div>
              )}

              {interview.interview_scorecard_items.length > 0 && (
                <div className="mb-4">
                  <p className="text-cream-dim text-xs uppercase tracking-wide mb-2">
                    Question Scorecard
                  </p>
                  <div className="space-y-2">
                    {interview.interview_scorecard_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 text-sm bg-charcoal-raised rounded-[8px] px-3 py-2"
                      >
                        <span className="font-mono text-amber shrink-0">
                          {item.score}/5
                        </span>
                        <div>
                          <p className="text-cream">{item.question_text_snapshot}</p>
                          {item.notes && (
                            <p className="text-cream-dim text-xs mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-cream-dim text-xs uppercase tracking-wide mb-1">
                    What went well
                  </p>
                  <p className="text-cream">{interview.strengths || '—'}</p>
                </div>
                <div>
                  <p className="text-cream-dim text-xs uppercase tracking-wide mb-1">
                    What needs improvement
                  </p>
                  <p className="text-cream">{interview.improvements || '—'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
