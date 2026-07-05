import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuestions } from '../../hooks/useQuestions'
import { useInterviewTypes } from '../../hooks/useInterviewTypes'
import type { Difficulty, Question } from '../../types/database'
import Modal from '../../components/ui/Modal'
import BulkUploadQuestionsModal from '../../components/BulkUploadQuestionsModal'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { difficultyStyles } from '../../utils/format'

interface QuestionForm {
  type_id: string
  difficulty: Difficulty
  question_text: string
  ideal_answer: string
}

const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard']

export default function QuestionBank() {
  const { types } = useInterviewTypes()
  const activeTypes = useMemo(() => types.filter((t) => !t.archived), [types])

  const [typeFilter, setTypeFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>('')

  const {
    questions,
    loading,
    error,
    createQuestion,
    createQuestions,
    updateQuestion,
    deleteQuestion,
  } = useQuestions({ typeId: typeFilter, difficulty: difficultyFilter })

  const [modalOpen, setModalOpen] = useState(false)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [editing, setEditing] = useState<Question | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionForm>()

  const openCreate = () => {
    setEditing(null)
    reset({
      type_id: typeFilter || activeTypes[0]?.id || '',
      difficulty: 'Medium',
      question_text: '',
      ideal_answer: '',
    })
    setActionError(null)
    setModalOpen(true)
  }

  const openEdit = (q: Question) => {
    setEditing(q)
    reset({
      type_id: q.type_id ?? '',
      difficulty: q.difficulty,
      question_text: q.question_text,
      ideal_answer: q.ideal_answer ?? '',
    })
    setActionError(null)
    setModalOpen(true)
  }

  const onSubmit = async (values: QuestionForm) => {
    try {
      if (editing) await updateQuestion(editing.id, values)
      else await createQuestion(values)
      setModalOpen(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const handleDelete = async (q: Question) => {
    if (!confirm('Delete this question?')) return
    try {
      await deleteQuestion(q.id)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not delete this question.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-cream">Question Bank</h1>
          <p className="text-cream-dim text-sm mt-1">
            Questions are tagged by type and difficulty, and auto-filtered when
            an interview starts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => setBulkModalOpen(true)}
            type="button"
            disabled={activeTypes.length === 0}
          >
            Bulk Upload
          </button>
          <button
            className="btn-primary"
            onClick={openCreate}
            type="button"
            disabled={activeTypes.length === 0}
          >
            + Add Question
          </button>
        </div>
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
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as Difficulty | '')}
        >
          <option value="">All difficulties</option>
          {difficulties.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {activeTypes.length === 0 && !loading && (
        <p className="text-cream-dim text-sm mb-4">
          Add an interview type first before creating questions.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions found"
          description="Try clearing filters, or add a question to this bank."
        />
      ) : (
        <div className="panel-card divide-y divide-border-soft">
          {questions.map((q) => (
            <div key={q.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge className={difficultyStyles[q.difficulty]}>
                      {q.difficulty}
                    </Badge>
                    <Badge className="bg-teal/10 text-teal">
                      {q.interview_types?.name ?? 'Unassigned'}
                    </Badge>
                  </div>
                  <p className="text-cream">{q.question_text}</p>
                  {q.ideal_answer && (
                    <p className="text-sm text-cream-dim mt-1.5">
                      <span className="text-cream-dim/70">Ideal answer: </span>
                      {q.ideal_answer}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="btn-ghost"
                    onClick={() => openEdit(q)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="btn-ghost hover:text-danger"
                    onClick={() => handleDelete(q)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Question' : 'Add Question'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="panel-label" htmlFor="q-type">
                Interview Type
              </label>
              <select
                id="q-type"
                className="panel-input"
                {...register('type_id', { required: true })}
              >
                {activeTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="panel-label" htmlFor="q-difficulty">
                Difficulty
              </label>
              <select
                id="q-difficulty"
                className="panel-input"
                {...register('difficulty', { required: true })}
              >
                {difficulties.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="panel-label" htmlFor="q-text">
              Question
            </label>
            <textarea
              id="q-text"
              className="panel-input min-h-24"
              placeholder="e.g. Explain the event loop in Node.js"
              {...register('question_text', { required: 'Question text is required' })}
            />
            {errors.question_text && (
              <p className="text-danger text-xs mt-1">
                {errors.question_text.message}
              </p>
            )}
          </div>

          <div>
            <label className="panel-label" htmlFor="q-answer">
              Ideal Answer (optional)
            </label>
            <textarea
              id="q-answer"
              className="panel-input min-h-20"
              placeholder="Key points the answer should cover"
              {...register('ideal_answer')}
            />
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
              {editing ? 'Save' : 'Add Question'}
            </button>
          </div>
        </form>
      </Modal>

      <BulkUploadQuestionsModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        types={activeTypes}
        defaultTypeId={typeFilter}
        onImport={createQuestions}
      />
    </div>
  )
}
