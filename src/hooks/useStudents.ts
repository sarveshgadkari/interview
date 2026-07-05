import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { InterviewMode, Student, StudentStatus } from '../types/database'

export interface StudentWithRelations extends Student {
  interview_types: { name: string } | null
  trainers: { name: string } | null
}

export interface StudentFilters {
  typeId?: string
  trainerId?: string
  status?: StudentStatus | ''
  search?: string
}

export interface StudentInput {
  name: string
  email?: string | null
  phone?: string | null
  type_id?: string | null
  trainer_id?: string | null
  interview_mode?: InterviewMode
  status?: StudentStatus
  applied_date?: string
  notes?: string | null
}

export function useStudents(filters: StudentFilters = {}) {
  const [students, setStudents] = useState<StudentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('students')
      .select('*, interview_types(name), trainers(name)')
      .order('created_at', { ascending: false })

    if (filters.typeId) query = query.eq('type_id', filters.typeId)
    if (filters.trainerId) query = query.eq('trainer_id', filters.trainerId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.search) query = query.ilike('name', `%${filters.search}%`)

    const { data, error } = await query
    if (error) setError(error.message)
    else setStudents((data as StudentWithRelations[]) ?? [])
    setLoading(false)
  }, [filters.typeId, filters.trainerId, filters.status, filters.search])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createStudent = useCallback(
    async (input: StudentInput) => {
      const { error } = await supabase.from('students').insert(input)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const updateStudent = useCallback(
    async (id: string, input: Partial<StudentInput>) => {
      const { error } = await supabase
        .from('students')
        .update(input)
        .eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const deleteStudent = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  return { students, loading, error, refresh, createStudent, updateStudent, deleteStudent }
}
