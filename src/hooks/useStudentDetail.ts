import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { InterviewScorecardItem } from '../types/database'
import type { StudentWithRelations } from './useStudents'
import type { InterviewWithRelations } from './useInterviews'

export interface InterviewWithScorecard extends InterviewWithRelations {
  interview_scorecard_items: InterviewScorecardItem[]
}

export async function fetchStudentDetail(studentId: string) {
  const [studentRes, interviewsRes] = await Promise.all([
    supabase
      .from('students')
      .select('*, interview_types(name), trainers(name)')
      .eq('id', studentId)
      .maybeSingle(),
    supabase
      .from('interviews')
      .select(
        '*, students(name), interview_types(name), trainers(name), interview_scorecard_items(*)',
      )
      .eq('student_id', studentId)
      .order('date', { ascending: false }),
  ])

  if (studentRes.error) throw studentRes.error
  if (interviewsRes.error) throw interviewsRes.error

  return {
    student: studentRes.data as StudentWithRelations | null,
    interviews: (interviewsRes.data as InterviewWithScorecard[]) ?? [],
  }
}

export function useStudentDetail(studentId: string | undefined) {
  const [student, setStudent] = useState<StudentWithRelations | null>(null)
  const [interviews, setInterviews] = useState<InterviewWithScorecard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const result = await fetchStudentDetail(studentId)
      setStudent(result.student)
      setInterviews(result.interviews)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load student')
    }
    setLoading(false)
  }, [studentId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { student, interviews, loading, error, refresh }
}
