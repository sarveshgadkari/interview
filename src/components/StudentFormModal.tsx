import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from './ui/Modal'
import type { InterviewMode, InterviewType, StudentStatus, Trainer } from '../types/database'
import type { StudentInput } from '../hooks/useStudents'

const modes: InterviewMode[] = ['Mock Interview', 'Final Interview']
const statuses: StudentStatus[] = [
  'New',
  'Interviewed',
  'Selected',
  'Rejected',
  'Needs Retest',
]

export interface StudentFormValues {
  name: string
  email: string
  phone: string
  type_id: string
  trainer_id: string
  interview_mode: InterviewMode
  status: StudentStatus
  applied_date: string
  notes: string
}

const emptyValues: StudentFormValues = {
  name: '',
  email: '',
  phone: '',
  type_id: '',
  trainer_id: '',
  interview_mode: 'Mock Interview',
  status: 'New',
  applied_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function StudentFormModal({
  open,
  onClose,
  onSubmit,
  types,
  trainers,
  initialValues,
  title,
  allowStatusEdit = true,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (values: StudentInput) => Promise<void>
  types: InterviewType[]
  trainers: Trainer[]
  initialValues?: Partial<StudentFormValues>
  title: string
  allowStatusEdit?: boolean
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<StudentFormValues>({ defaultValues: emptyValues })

  useEffect(() => {
    if (open) reset({ ...emptyValues, ...initialValues })
  }, [open, initialValues, reset])

  const submit = async (values: StudentFormValues) => {
    try {
      await onSubmit({
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        type_id: values.type_id || null,
        trainer_id: values.trainer_id || null,
        interview_mode: values.interview_mode,
        status: values.status,
        applied_date: values.applied_date,
        notes: values.notes || null,
      })
      onClose()
    } catch (e) {
      setError('root', {
        message: e instanceof Error ? e.message : 'Something went wrong',
      })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="panel-label" htmlFor="s-name">
              Full Name
            </label>
            <input
              id="s-name"
              className="panel-input"
              placeholder="e.g. Ananya Rao"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && (
              <p className="text-danger text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="panel-label" htmlFor="s-email">
              Email
            </label>
            <input
              id="s-email"
              type="email"
              className="panel-input"
              placeholder="student@email.com"
              {...register('email')}
            />
          </div>
          <div>
            <label className="panel-label" htmlFor="s-phone">
              Phone
            </label>
            <input
              id="s-phone"
              className="panel-input"
              placeholder="+91 90000 00000"
              {...register('phone')}
            />
          </div>

          <div>
            <label className="panel-label" htmlFor="s-type">
              Interview Type (Track)
            </label>
            <select id="s-type" className="panel-input" {...register('type_id')}>
              <option value="">Unassigned</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label" htmlFor="s-trainer">
              Trainer
            </label>
            <select
              id="s-trainer"
              className="panel-input"
              {...register('trainer_id')}
            >
              <option value="">Unassigned</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="panel-label" htmlFor="s-mode">
              Interview Mode
            </label>
            <select
              id="s-mode"
              className="panel-input"
              {...register('interview_mode')}
            >
              {modes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label" htmlFor="s-applied">
              Applied Date
            </label>
            <input
              id="s-applied"
              type="date"
              className="panel-input"
              {...register('applied_date')}
            />
          </div>

          {allowStatusEdit && (
            <div className="col-span-2">
              <label className="panel-label" htmlFor="s-status">
                Status
              </label>
              <select id="s-status" className="panel-input" {...register('status')}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="col-span-2">
            <label className="panel-label" htmlFor="s-notes">
              Notes
            </label>
            <textarea
              id="s-notes"
              className="panel-input min-h-20"
              placeholder="Any context worth noting"
              {...register('notes')}
            />
          </div>
        </div>

        {errors.root && (
          <div className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-[10px] px-3 py-2">
            {errors.root.message}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  )
}
