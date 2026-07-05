import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type {
  Interview,
  InterviewScorecardItem,
  MarkingScoreEntry,
  Verdict,
} from '../types/database'
import { verdictToStatus } from '../utils/format'

export interface InterviewWithRelations extends Interview {
  students: { name: string } | null
  interview_types: { name: string } | null
  trainers: { name: string } | null
}

export interface InterviewFilters {
  typeId?: string
  trainerId?: string
  dateFrom?: string
  dateTo?: string
}

export function useInterviews(filters: InterviewFilters = {}) {
  const [interviews, setInterviews] = useState<InterviewWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('interviews')
      .select('*, students(name), interview_types(name), trainers(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters.typeId) query = query.eq('type_id', filters.typeId)
    if (filters.trainerId) query = query.eq('trainer_id', filters.trainerId)
    if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
    if (filters.dateTo) query = query.lte('date', filters.dateTo)

    const { data, error } = await query
    if (error) setError(error.message)
    else setInterviews((data as InterviewWithRelations[]) ?? [])
    setLoading(false)
  }, [filters.typeId, filters.trainerId, filters.dateFrom, filters.dateTo])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { interviews, loading, error, refresh }
}

export interface ScorecardEntry {
  question_id: string
  question_text_snapshot: string
  score: number
  notes?: string
}

export interface SubmitInterviewInput {
  student_id: string
  type_id: string
  trainer_id: string | null
  interview_mode: string
  date: string
  marking_scores: MarkingScoreEntry[]
  strengths: string
  improvements: string
  verdict: Verdict
  scorecard: ScorecardEntry[]
}

function computeScores(input: SubmitInterviewInput) {
  const questionScoreTotal = input.scorecard.reduce((sum, item) => sum + item.score, 0)
  const questionMaxTotal = input.scorecard.length * 5
  const markingTotal = input.marking_scores.reduce((sum, item) => sum + item.score, 0)
  const markingMaxTotal = input.marking_scores.length * 5
  return {
    total_score: questionScoreTotal + markingTotal,
    max_score: questionMaxTotal + markingMaxTotal,
  }
}

function interviewFields(input: SubmitInterviewInput) {
  const { total_score, max_score } = computeScores(input)
  return {
    student_id: input.student_id,
    type_id: input.type_id,
    trainer_id: input.trainer_id,
    interview_mode: input.interview_mode,
    date: input.date,
    total_score,
    max_score,
    marking_scores: input.marking_scores,
    strengths: input.strengths,
    improvements: input.improvements,
    verdict: input.verdict,
  }
}

export async function submitInterview(input: SubmitInterviewInput) {
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .insert(interviewFields(input))
    .select()
    .single()

  if (interviewError) throw interviewError

  if (input.scorecard.length > 0) {
    const { error: scorecardError } = await supabase
      .from('interview_scorecard_items')
      .insert(
        input.scorecard.map((item) => ({
          interview_id: interview.id,
          question_id: item.question_id,
          question_text_snapshot: item.question_text_snapshot,
          score: item.score,
          notes: item.notes ?? null,
        })),
      )
    if (scorecardError) throw scorecardError
  }

  const newStatus = verdictToStatus(input.verdict)
  const { error: studentError } = await supabase
    .from('students')
    .update({ status: newStatus })
    .eq('id', input.student_id)
  if (studentError) throw studentError

  return interview as Interview
}

export async function updateInterview(interviewId: string, input: SubmitInterviewInput) {
  const { error: interviewError } = await supabase
    .from('interviews')
    .update(interviewFields(input))
    .eq('id', interviewId)
  if (interviewError) throw interviewError

  const { error: deleteError } = await supabase
    .from('interview_scorecard_items')
    .delete()
    .eq('interview_id', interviewId)
  if (deleteError) throw deleteError

  if (input.scorecard.length > 0) {
    const { error: scorecardError } = await supabase
      .from('interview_scorecard_items')
      .insert(
        input.scorecard.map((item) => ({
          interview_id: interviewId,
          question_id: item.question_id,
          question_text_snapshot: item.question_text_snapshot,
          score: item.score,
          notes: item.notes ?? null,
        })),
      )
    if (scorecardError) throw scorecardError
  }

  const newStatus = verdictToStatus(input.verdict)
  const { error: studentError } = await supabase
    .from('students')
    .update({ status: newStatus })
    .eq('id', input.student_id)
  if (studentError) throw studentError
}

export interface InterviewWithScorecardItems extends Interview {
  interview_scorecard_items: InterviewScorecardItem[]
}

export async function fetchLatestInterviewForStudent(studentId: string) {
  const { data, error } = await supabase
    .from('interviews')
    .select('*, interview_scorecard_items(*)')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as InterviewWithScorecardItems | null
}
