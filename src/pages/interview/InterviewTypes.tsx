import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useInterviewTypes } from '../../hooks/useInterviewTypes'
import type { InterviewType } from '../../types/database'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { formatDate } from '../../utils/format'

interface TypeForm {
  name: string
}

const DEFAULT_CRITERIA = [
  'Communication',
  'Technical Knowledge',
  'Problem Solving',
  'Confidence & Attitude',
]

export default function InterviewTypes() {
  const { types, loading, error, createType, updateType, setArchived, deleteType } =
    useInterviewTypes()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<InterviewType | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<string[]>(DEFAULT_CRITERIA)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TypeForm>()

  const openCreate = () => {
    setEditing(null)
    reset({ name: '' })
    setCriteria(DEFAULT_CRITERIA)
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (type: InterviewType) => {
    setEditing(type)
    reset({ name: type.name })
    setCriteria(
      type.marking_criteria?.length > 0 ? type.marking_criteria : DEFAULT_CRITERIA,
    )
    setActionError(null)
    setModalOpen(true)
  }

  const updateCriterion = (index: number, value: string) => {
    setCriteria((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index))
  }

  const addCriterion = () => {
    setCriteria((prev) => [...prev, ''])
  }

  const onSubmit = async (values: TypeForm) => {
    const cleanedCriteria = criteria.map((c) => c.trim()).filter(Boolean)
    if (cleanedCriteria.length === 0) {
      setActionError('Add at least one marking criterion.')
      return
    }
    try {
      if (editing) {
        await updateType(editing.id, {
          name: values.name,
          marking_criteria: cleanedCriteria,
        })
      } else {
        await createType(values.name, cleanedCriteria)
      }
      setModalOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const handleDelete = async (type: InterviewType) => {
    if (!confirm(`Delete "${type.name}"? This cannot be undone.`)) return
    try {
      await deleteType(type.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete this type.')
    }
  }

  const visibleTypes = types.filter((t) => showArchived || !t.archived)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-cream">Interview Types</h1>
          <p className="text-cream-dim text-sm mt-1">
            Tracks used across the question bank and student assignments. Each
            type defines its own marking scheme.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">
          + Add Type
        </button>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-cream-dim mb-4">
        <input
          type="checkbox"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="accent-amber"
        />
        Show archived
      </label>

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : visibleTypes.length === 0 ? (
        <EmptyState
          title="No interview types yet"
          description="Add your first track (e.g. MERN Stack, System Design) to start building the question bank."
          action={
            <button className="btn-primary" onClick={openCreate} type="button">
              + Add Type
            </button>
          }
        />
      ) : (
        <div className="panel-card divide-y divide-border-soft">
          {visibleTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between px-5 py-4 gap-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-cream font-medium">{type.name}</p>
                  {type.archived && (
                    <Badge className="bg-cream-dim/10 text-cream-dim">
                      Archived
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-cream-dim font-mono mt-1">
                  Added {formatDate(type.created_at)}
                </p>
                <p className="text-xs text-teal mt-1.5 truncate">
                  {type.marking_criteria?.length
                    ? type.marking_criteria.join(' · ')
                    : 'No marking criteria configured'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="btn-ghost"
                  onClick={() => openEdit(type)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => setArchived(type.id, !type.archived)}
                  type="button"
                >
                  {type.archived ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  className="btn-ghost hover:text-danger"
                  onClick={() => handleDelete(type)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Interview Type' : 'Add Interview Type'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="panel-label" htmlFor="type-name">
              Name
            </label>
            <input
              id="type-name"
              className="panel-input"
              placeholder="e.g. MERN Stack"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <p className="text-danger text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="panel-label">Marking Scheme</label>
            <p className="text-xs text-cream-dim mb-2">
              These criteria are scored 0–5 each when an interview is submitted
              for this type.
            </p>
            <div className="space-y-2">
              {criteria.map((criterion, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    className="panel-input"
                    placeholder="e.g. System Design Depth"
                    value={criterion}
                    onChange={(e) => updateCriterion(idx, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-ghost hover:text-danger shrink-0"
                    onClick={() => removeCriterion(idx)}
                    aria-label="Remove criterion"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary mt-2"
              onClick={addCriterion}
            >
              + Add Criterion
            </button>
          </div>

          {actionError && (
            <div className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-[10px] px-3 py-2">
              {actionError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {editing ? 'Save' : 'Add Type'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
