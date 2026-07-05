import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents, type StudentWithRelations } from '../../hooks/useStudents'
import { useInterviewTypes } from '../../hooks/useInterviewTypes'
import { useTrainers } from '../../hooks/useTrainers'
import type { StudentStatus } from '../../types/database'
import StudentFormModal, { type StudentFormValues } from '../../components/StudentFormModal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { formatDate, statusStyles } from '../../utils/format'

const statuses: StudentStatus[] = [
  'New',
  'Interviewed',
  'Selected',
  'Rejected',
  'Needs Retest',
]

export default function Students() {
  const navigate = useNavigate()
  const { types } = useInterviewTypes()
  const { trainers } = useTrainers()
  const activeTypes = useMemo(() => types.filter((t) => !t.archived), [types])

  const [typeFilter, setTypeFilter] = useState('')
  const [trainerFilter, setTrainerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>('')
  const [search, setSearch] = useState('')

  const { students, loading, error, createStudent, updateStudent, deleteStudent } =
    useStudents({
      typeId: typeFilter,
      trainerId: trainerFilter,
      status: statusFilter,
      search,
    })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<StudentWithRelations | null>(null)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (s: StudentWithRelations) => {
    setEditing(s)
    setModalOpen(true)
  }

  const initialValues: Partial<StudentFormValues> | undefined = editing
    ? {
        name: editing.name,
        email: editing.email ?? '',
        phone: editing.phone ?? '',
        type_id: editing.type_id ?? '',
        trainer_id: editing.trainer_id ?? '',
        interview_mode: editing.interview_mode,
        status: editing.status,
        applied_date: editing.applied_date,
        notes: editing.notes ?? '',
      }
    : undefined

  const handleSave = async (values: Parameters<typeof createStudent>[0]) => {
    if (editing) await updateStudent(editing.id, values)
    else await createStudent(values)
  }

  const handleDelete = async (s: StudentWithRelations) => {
    if (!confirm(`Remove student "${s.name}"? This deletes their interview history too.`))
      return
    try {
      await deleteStudent(s.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not remove this student.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-cream">Students</h1>
          <p className="text-cream-dim text-sm mt-1">
            Manage students and kick off interviews from here.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">
          + Add Student
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="panel-input w-auto min-w-48"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
        <select
          className="panel-input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : students.length === 0 ? (
        <EmptyState
          title="No students found"
          description="Try clearing filters, or add a new student."
          action={
            <button className="btn-primary" onClick={openCreate} type="button">
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
                <th className="px-5 py-3 font-medium">Mode</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Applied</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft">
              {students.map((s) => (
                <tr key={s.id}>
                  <td className="px-5 py-3">
                    <p className="text-cream font-medium">{s.name}</p>
                    <p className="text-xs text-cream-dim">{s.email}</p>
                  </td>
                  <td className="px-5 py-3 text-cream-dim">
                    {s.interview_types?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-cream-dim">
                    {s.trainers?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-cream-dim">{s.interview_mode}</td>
                  <td className="px-5 py-3">
                    <Badge className={statusStyles[s.status]}>{s.status}</Badge>
                  </td>
                  <td className="px-5 py-3 font-mono text-cream-dim">
                    {formatDate(s.applied_date)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="btn-ghost text-amber hover:text-amber"
                        onClick={() =>
                          navigate(`/interview/students/${s.id}/start-interview`)
                        }
                        type="button"
                      >
                        {s.status === 'New' ? 'Start Interview' : 'Edit Report'}
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => openEdit(s)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-ghost hover:text-danger"
                        onClick={() => handleDelete(s)}
                        type="button"
                      >
                        Delete
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
        onSubmit={handleSave}
        types={activeTypes}
        trainers={trainers}
        initialValues={initialValues}
        title={editing ? 'Edit Student' : 'Add Student'}
      />
    </div>
  )
}
