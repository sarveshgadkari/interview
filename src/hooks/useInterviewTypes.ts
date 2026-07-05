import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { InterviewType } from '../types/database'

export function useInterviewTypes() {
  const [types, setTypes] = useState<InterviewType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('interview_types')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setTypes(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createType = useCallback(
    async (name: string, markingCriteria: string[]) => {
      const { error } = await supabase
        .from('interview_types')
        .insert({ name, marking_criteria: markingCriteria })
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const updateType = useCallback(
    async (id: string, updates: { name?: string; marking_criteria?: string[] }) => {
      const { error } = await supabase
        .from('interview_types')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const setArchived = useCallback(
    async (id: string, archived: boolean) => {
      const { error } = await supabase
        .from('interview_types')
        .update({ archived })
        .eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const checkInUse = useCallback(async (id: string) => {
    const [{ count: studentCount }, { count: questionCount }] =
      await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('type_id', id),
        supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('type_id', id),
      ])
    return (studentCount ?? 0) + (questionCount ?? 0) > 0
  }, [])

  const deleteType = useCallback(
    async (id: string) => {
      const inUse = await checkInUse(id)
      if (inUse) {
        throw new Error(
          'This type is in use by students or questions. Reassign or archive it instead.',
        )
      }
      const { error } = await supabase
        .from('interview_types')
        .delete()
        .eq('id', id)
      if (error) throw error
      await refresh()
    },
    [checkInUse, refresh],
  )

  return {
    types,
    loading,
    error,
    refresh,
    createType,
    updateType,
    setArchived,
    deleteType,
    checkInUse,
  }
}
