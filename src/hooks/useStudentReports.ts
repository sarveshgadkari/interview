import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Student, StudentStatus, Verdict } from '../types/database'
import { scorePercent } from '../utils/format'

export interface StudentReportRow {
  student: Student
  typeName: string
  trainerName: string
  interviewCount: number
  averageScorePercent: number
  latestVerdict: Verdict | null
  status: StudentStatus
}

interface RawInterview {
  total_score: number
  max_score: number
  verdict: Verdict | null
  date: string
  created_at: string
}

export function useStudentReports() {
  const [rows, setRows] = useState<StudentReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select(
        '*, interview_types(name), trainers(name), interviews(total_score, max_score, verdict, date, created_at)',
      )
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    type StudentRow = Student & {
      interview_types: { name: string } | null
      trainers: { name: string } | null
      interviews: RawInterview[]
    }

    const mapped: StudentReportRow[] = ((data ?? []) as StudentRow[]).map(
      (row) => {
        const interviewList = row.interviews ?? []
        const totalScoreSum = interviewList.reduce(
          (sum, i) => sum + scorePercent(i.total_score, i.max_score),
          0,
        )
        const averageScorePercent = interviewList.length
          ? Math.round(totalScoreSum / interviewList.length)
          : 0

        const latest = [...interviewList].sort((a, b) =>
          `${b.date}${b.created_at}`.localeCompare(`${a.date}${a.created_at}`),
        )[0]

        return {
          student: row,
          typeName: row.interview_types?.name ?? 'Unassigned',
          trainerName: row.trainers?.name ?? 'Unassigned',
          interviewCount: interviewList.length,
          averageScorePercent,
          latestVerdict: latest?.verdict ?? null,
          status: row.status,
        }
      },
    )

    setRows(mapped)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { rows, loading, error, refresh }
}
