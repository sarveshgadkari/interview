import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useInterviewTypes } from '../../hooks/useInterviewTypes'
import { useTrainers } from '../../hooks/useTrainers'
import { useQuestions, type QuestionWithType } from '../../hooks/useQuestions'
import { useTrainerSession } from '../../contexts/TrainerSessionContext'
import {
  submitInterview,
  updateInterview,
  fetchLatestInterviewForStudent,
  type ScorecardEntry,
} from '../../hooks/useInterviews'
import type {
  InterviewMode,
  MarkingScoreEntry,
  Student,
  Verdict,
} from '../../types/database'
import ScoreSelector from '../../components/ScoreSelector'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import { difficultyStyles } from '../../utils/format'

const modes: InterviewMode[] = ['Mock Interview', 'Final Interview']
const verdicts: Verdict[] = ['Strong Hire', 'Hire', 'No Hire', 'Strong No Hire']

interface QuestionState {
  checked: boolean
  score: number
  notes: string
}

export default function StartInterview() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()
  const { types } = useInterviewTypes()
  const { trainers } = useTrainers()
  const { activeTrainerId } = useTrainerSession()

  const [student, setStudent] = useState<Student | null>(null)
  const [loadingStudent, setLoadingStudent] = useState(true)

  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null)
  const [savedScorecard, setSavedScorecard] = useState<
    { question_id: string | null; score: number; notes: string | null }[]
  >([])
  const [seeded, setSeeded] = useState(false)

  const [typeId, setTypeId] = useState('')
  const [mode, setMode] = useState<InterviewMode>('Mock Interview')
  const [trainerId, setTrainerId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  const { questions: liveQuestions, loading: loadingQuestions } = useQuestions({ typeId })
  const [legacyQuestions, setLegacyQuestions] = useState<QuestionWithType[]>([])
  const [questionState, setQuestionState] = useState<Record<string, QuestionState>>({})

  const [markingScores, setMarkingScores] = useState<MarkingScoreEntry[]>([])
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  const [verdict, setVerdict] = useState<Verdict>('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Load the student, then check whether they already have an interview to edit in place.
  useEffect(() => {
    if (!studentId) return
    let active = true
    setLoadingStudent(true)

    Promise.all([
      supabase.from('students').select('*').eq('id', studentId).maybeSingle(),
      fetchLatestInterviewForStudent(studentId),
    ]).then(([studentRes, existingInterview]) => {
      if (!active) return
      const data = studentRes.data
      setStudent(data)

      if (existingInterview) {
        setEditingInterviewId(existingInterview.id)
        setTypeId(existingInterview.type_id ?? data?.type_id ?? '')
        setMode((existingInterview.interview_mode as InterviewMode) || data?.interview_mode || 'Mock Interview')
        setTrainerId(existingInterview.trainer_id ?? '')
        setDate(existingInterview.date)
        setMarkingScores(existingInterview.marking_scores ?? [])
        setStrengths(existingInterview.strengths ?? '')
        setImprovements(existingInterview.improvements ?? '')
        setVerdict((existingInterview.verdict as Verdict) ?? '')
        setSavedScorecard(
          existingInterview.interview_scorecard_items.map((item) => ({
            question_id: item.question_id,
            score: item.score,
            notes: item.notes,
          })),
        )
      } else if (data) {
        setTypeId(data.type_id ?? '')
        setMode(data.interview_mode)
      }

      setLoadingStudent(false)
    })

    return () => {
      active = false
    }
  }, [studentId])

  useEffect(() => {
    if (!editingInterviewId && activeTrainerId) setTrainerId(activeTrainerId)
  }, [activeTrainerId, editingInterviewId])

  // Marking scheme always mirrors the selected type's criteria list. When the
  // type changes (or its criteria load in), rebuild the list but keep any
  // already-entered score for criteria whose name still matches.
  useEffect(() => {
    const type = types.find((t) => t.id === typeId)
    if (!type) return
    setMarkingScores((prev) =>
      (type.marking_criteria ?? []).map((criterion) => {
        const existing = prev.find((p) => p.criterion === criterion)
        return { criterion, score: existing?.score ?? 0 }
      }),
    )
  }, [typeId, types])

  // If editing, pull in full Question rows for any scorecard entries that fall
  // outside the current type filter (e.g. the type was changed since asking).
  useEffect(() => {
    if (savedScorecard.length === 0 || loadingQuestions) return
    const knownIds = new Set([
      ...liveQuestions.map((q) => q.id),
      ...legacyQuestions.map((q) => q.id),
    ])
    const missingIds = savedScorecard
      .map((s) => s.question_id)
      .filter((id): id is string => !!id && !knownIds.has(id))

    if (missingIds.length === 0) return
    supabase
      .from('questions')
      .select('*, interview_types(name)')
      .in('id', missingIds)
      .then(({ data }) => {
        if (data) setLegacyQuestions((prev) => [...prev, ...(data as QuestionWithType[])])
      })
  }, [savedScorecard, liveQuestions, legacyQuestions, loadingQuestions])

  const displayQuestions = useMemo(() => {
    const liveIds = new Set(liveQuestions.map((q) => q.id))
    return [...liveQuestions, ...legacyQuestions.filter((q) => !liveIds.has(q.id))]
  }, [liveQuestions, legacyQuestions])

  useEffect(() => {
    setQuestionState((prev) => {
      const next: Record<string, QuestionState> = {}
      for (const q of displayQuestions) {
        if (prev[q.id]) {
          next[q.id] = prev[q.id]
          continue
        }
        const saved = !seeded
          ? savedScorecard.find((s) => s.question_id === q.id)
          : undefined
        next[q.id] = saved
          ? { checked: true, score: saved.score, notes: saved.notes ?? '' }
          : { checked: false, score: 0, notes: '' }
      }
      return next
    })
    if (displayQuestions.length > 0) setSeeded(true)
  }, [displayQuestions, savedScorecard, seeded])

  const activeTypes = useMemo(() => types.filter((t) => !t.archived), [types])

  const toggleQuestion = (id: string) => {
    setQuestionState((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked: !prev[id].checked },
    }))
  }

  const setQuestionScore = (id: string, score: number) => {
    setQuestionState((prev) => ({ ...prev, [id]: { ...prev[id], score } }))
  }

  const setQuestionNotes = (id: string, notes: string) => {
    setQuestionState((prev) => ({ ...prev, [id]: { ...prev[id], notes } }))
  }

  const askedCount = Object.values(questionState).filter((q) => q.checked).length

  const handleSubmit = async () => {
    if (!studentId) return
    if (!typeId) {
      setSubmitError('Select an interview type before submitting.')
      return
    }
    if (!trainerId) {
      setSubmitError('Select which trainer is conducting this interview.')
      return
    }

    const scorecard: ScorecardEntry[] = displayQuestions
      .filter((q) => questionState[q.id]?.checked)
      .map((q) => ({
        question_id: q.id,
        question_text_snapshot: q.question_text,
        score: questionState[q.id].score,
        notes: questionState[q.id].notes || undefined,
      }))

    const payload = {
      student_id: studentId,
      type_id: typeId,
      trainer_id: trainerId,
      interview_mode: mode,
      date,
      marking_scores: markingScores,
      strengths,
      improvements,
      verdict,
      scorecard,
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      if (editingInterviewId) await updateInterview(editingInterviewId, payload)
      else await submitInterview(payload)
      navigate('/interview/students')
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Could not save interview.')
      setSubmitting(false)
    }
  }

  if (loadingStudent) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (!student) {
    return <p className="text-danger text-sm">Student not found.</p>
  }

  return (
    <div className="pb-16">
      <div className="mb-6">
        <p className="text-cream-dim text-sm">
          {editingInterviewId ? 'Editing interview report for' : 'Interview for'}
        </p>
        <h1 className="text-2xl text-cream">{student.name}</h1>
        {editingInterviewId && (
          <Badge className="bg-teal/15 text-teal mt-2">
            Editing existing report — saving overwrites it
          </Badge>
        )}
      </div>

      <div className="panel-card p-5 mb-6">
        <h2 className="text-cream font-display text-lg mb-4">Setup</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="panel-label">Interview Type</label>
            <select
              className="panel-input"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">Select type…</option>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label">Mode</label>
            <select
              className="panel-input"
              value={mode}
              onChange={(e) => setMode(e.target.value as InterviewMode)}
            >
              {modes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label">Conducted By</label>
            <select
              className="panel-input"
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
            >
              <option value="">Select trainer…</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="panel-label">Date</label>
            <input
              type="date"
              className="panel-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-cream font-display text-lg">Question Bank</h2>
          <span className="text-xs text-cream-dim font-mono">
            {askedCount} asked
          </span>
        </div>

        {!typeId ? (
          <p className="text-cream-dim text-sm">
            Select an interview type to load its questions.
          </p>
        ) : loadingQuestions ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : displayQuestions.length === 0 ? (
          <p className="text-cream-dim text-sm">
            No questions in the bank for this type yet.
          </p>
        ) : (
          <div className="space-y-3">
            {displayQuestions.map((q) => {
              const state = questionState[q.id]
              if (!state) return null
              return (
                <div
                  key={q.id}
                  className={`rounded-[10px] border px-4 py-3 transition-colors ${
                    state.checked
                      ? 'border-amber/40 bg-amber/5'
                      : 'border-border-soft bg-charcoal-raised'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={state.checked}
                      onChange={() => toggleQuestion(q.id)}
                      className="mt-1 accent-amber"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={difficultyStyles[q.difficulty]}>
                          {q.difficulty}
                        </Badge>
                      </div>
                      <p className="text-cream text-sm">{q.question_text}</p>

                      {state.checked && (
                        <div className="mt-3 flex flex-wrap items-center gap-4">
                          <ScoreSelector
                            value={state.score}
                            onChange={(score) => setQuestionScore(q.id, score)}
                          />
                          <input
                            className="panel-input flex-1 min-w-40"
                            placeholder="Note (optional)"
                            value={state.notes}
                            onChange={(e) =>
                              setQuestionNotes(q.id, e.target.value)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="panel-card p-5 mb-6">
        <h2 className="text-cream font-display text-lg mb-4">Marking Scheme</h2>
        {!typeId ? (
          <p className="text-cream-dim text-sm">
            Select an interview type to load its marking scheme.
          </p>
        ) : markingScores.length === 0 ? (
          <p className="text-cream-dim text-sm">
            This type has no marking criteria configured. Add some from Interview
            Types.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {markingScores.map((m, idx) => (
              <div key={m.criterion} className="flex items-center justify-between gap-4">
                <span className="text-sm text-cream">{m.criterion}</span>
                <ScoreSelector
                  value={m.score}
                  onChange={(score) =>
                    setMarkingScores((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, score } : p)),
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel-card p-5 mb-6">
        <h2 className="text-cream font-display text-lg mb-4">Feedback</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="panel-label">What went well</label>
            <textarea
              className="panel-input min-h-28"
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
            />
          </div>
          <div>
            <label className="panel-label">What needs improvement</label>
            <textarea
              className="panel-input min-h-28"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="panel-card p-5 mb-6">
        <h2 className="text-cream font-display text-lg mb-4">Final Verdict</h2>
        <div className="flex flex-wrap gap-2">
          {verdicts.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerdict(verdict === v ? '' : v)}
              className={`rounded-[10px] px-4 py-2 text-sm font-medium border transition-colors ${
                verdict === v
                  ? 'bg-amber text-charcoal border-amber'
                  : 'border-border-soft text-cream-dim hover:border-amber/50 hover:text-cream'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-[10px] px-3 py-2 mb-4">
          {submitError}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? 'Saving…'
            : editingInterviewId
              ? 'Save Changes'
              : 'Submit Interview'}
        </button>
      </div>
    </div>
  )
}
