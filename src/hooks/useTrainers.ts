import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Trainer } from '../types/database'

export function useTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setTrainers(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createTrainer = useCallback(
    async (name: string) => {
      const { error } = await supabase.from('trainers').insert({ name })
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const renameTrainer = useCallback(
    async (id: string, name: string) => {
      const { error } = await supabase
        .from('trainers')
        .update({ name })
        .eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const deleteTrainer = useCallback(
    async (id: string) => {
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('trainer_id', id)
      if ((count ?? 0) > 0) {
        throw new Error(
          'This trainer is assigned to students. Reassign those students first.',
        )
      }
      const { error } = await supabase.from('trainers').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  return { trainers, loading, error, refresh, createTrainer, renameTrainer, deleteTrainer }
}
