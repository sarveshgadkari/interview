import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTrainers } from '../../hooks/useTrainers'
import type { Trainer } from '../../types/database'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import { formatDate } from '../../utils/format'

interface TrainerForm {
  name: string
}

export default function Trainers() {
  const { trainers, loading, error, createTrainer, renameTrainer, deleteTrainer } =
    useTrainers()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Trainer | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrainerForm>()

  const openCreate = () => {
    setEditing(null)
    reset({ name: '' })
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (trainer: Trainer) => {
    setEditing(trainer)
    reset({ name: trainer.name })
    setActionError(null)
    setModalOpen(true)
  }

  const onSubmit = async (values: TrainerForm) => {
    try {
      if (editing) await renameTrainer(editing.id, values.name)
      else await createTrainer(values.name)
      setModalOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const handleDelete = async (trainer: Trainer) => {
    if (!confirm(`Remove trainer "${trainer.name}"?`)) return
    try {
      await deleteTrainer(trainer.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not remove this trainer.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-cream">Trainers</h1>
          <p className="text-cream-dim text-sm mt-1">
            Assign trainers to students and track who's taking interviews.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate} type="button">
          + Add Trainer
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : trainers.length === 0 ? (
        <EmptyState
          title="No trainers yet"
          description="Add trainers so they can be assigned to students and conduct interviews."
          action={
            <button className="btn-primary" onClick={openCreate} type="button">
              + Add Trainer
            </button>
          }
        />
      ) : (
        <div className="panel-card divide-y divide-border-soft">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <p className="text-cream font-medium">{trainer.name}</p>
                <p className="text-xs text-cream-dim font-mono mt-1">
                  Added {formatDate(trainer.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="btn-ghost"
                  onClick={() => openEdit(trainer)}
                  type="button"
                >
                  Rename
                </button>
                <button
                  className="btn-ghost hover:text-danger"
                  onClick={() => handleDelete(trainer)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Rename Trainer' : 'Add Trainer'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="panel-label" htmlFor="trainer-name">
              Name
            </label>
            <input
              id="trainer-name"
              className="panel-input"
              placeholder="e.g. Priya Sharma"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <p className="text-danger text-xs mt-1">{errors.name.message}</p>
            )}
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
              {editing ? 'Save' : 'Add Trainer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
