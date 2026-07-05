import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudentReports } from '../../hooks/useStudentReports'
import { useInterviewTypes } from '../../hooks/useInterviewTypes'
import { useTrainers } from '../../hooks/useTrainers'
import { useStudents } from '../../hooks/useStudents'
import StudentFormModal from '../../components/StudentFormModal'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { statusStyles, verdictStyles } from '../../utils/format'
import { fetchStudentDetail } from '../../hooks/useStudentDetail'
import { exportStudentReportPdf } from '../../utils/pdfExport'

export default function Reports() {
  const navigate = useNavigate()
  const { rows, loading, error, refresh } = useStudentReports()
  const { types } = useInterviewTypes()
  const { trainers } = useTrainers()
  const { createStudent } = useStudents()

  const [modalOpen, setModalOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const totalStudents = rows.length
  const interviewsTaken = rows.reduce((sum, r) => sum + r.interviewCount, 0)
  const awaitingInterview = rows.filter((r) => r.status === 'New').length

  const handleAddStudent = async (values: Parameters<typeof createStudent>[0]) => {
    await createStudent(values)
    await refresh()
  }

  const handleDownload = async (studentId: string) => {
    setDownloadingId(studentId)
    try {
      const { student, interviews } = await fetchStudentDetail(studentId)
      if (student) exportStudentReportPdf(student, interviews)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not generate PDF.')
    }
    setDownloadingId(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-cream">Reports</h1>
          <p className="text-cream-dim text-sm mt-1">
            Every student across every track, with rolled-up interview stats.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalOpen(true)} type="button">
          + Add Student
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Students" value={totalStudents} />
        <StatCard label="Interviews Taken" value={interviewsTaken} accent="text-teal" />
        <StatCard label="Awaiting Interview" value={awaitingInterview} accent="text-amber" />
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Add a student to start tracking their interview progress."
          action={
            <button className="btn-primary" onClick={() => setModalOpen(true)} type="button">
              + Add Student
            </button>
          }
        />
      ) : (
        <div className="panel-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-cream-dim text-xs uppercase tracking-wide border-b border-border-soft">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Trainer</th>
                <th className="px-5 py-3 font-medium"># Interviews</th>
                <th className="px-5 py-3 font-medium">Avg Score</th>
                <th className="px-5 py-3 font-medium">Latest Verdict</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Report</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {rows.map((r) => (
                <tr
                  key={r.student.id}
                  className="cursor-pointer hover:bg-charcoal-raised/60"
                  onClick={() => navigate(`/manager/students/${r.student.id}`)}
                >
                  <td className="px-5 py-3 text-cream font-medium">
                    {r.student.name}
                  </td>
                  <td className="px-5 py-3 text-cream-dim">{r.typeName}</td>
                  <td className="px-5 py-3 text-cream-dim">{r.trainerName}</td>
                  <td className="px-5 py-3 font-mono text-cream-dim">
                    {r.interviewCount}
                  </td>
                  <td className="px-5 py-3 font-mono text-cream">
                    {r.interviewCount ? `${r.averageScorePercent}%` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={verdictStyles[r.latestVerdict ?? '']}>
                      {r.latestVerdict || 'No verdict'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={statusStyles[r.status]}>{r.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="btn-ghost text-amber hover:text-amber"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/manager/students/${r.student.id}`)
                        }}
                        type="button"
                      >
                        View
                      </button>
                      <button
                        className="btn-ghost text-teal hover:text-teal"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(r.student.id)
                        }}
                        disabled={downloadingId === r.student.id}
                        type="button"
                      >
                        {downloadingId === r.student.id ? 'Preparing…' : 'Download PDF'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StudentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddStudent}
        types={types.filter((t) => !t.archived)}
        trainers={trainers}
        title="Add Student"
        allowStatusEdit={false}
      />
    </div>
  )
}
