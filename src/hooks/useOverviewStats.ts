import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface OverviewStats {
  totalStudents: number
  interviewsTaken: number
  awaitingInterview: number
  trainerInterviews: number
}

export function useOverviewStats(activeTrainerId: string | null) {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)

    async function load() {
      const [totalStudents, interviewsTaken, awaitingInterview, trainerInterviews] =
        await Promise.all([
          supabase.from('students').select('id', { count: 'exact', head: true }),
          supabase.from('interviews').select('id', { count: 'exact', head: true }),
          supabase
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'New'),
          activeTrainerId
            ? supabase
                .from('interviews')
                .select('id', { count: 'exact', head: true })
                .eq('trainer_id', activeTrainerId)
            : Promise.resolve({ count: 0 } as { count: number }),
        ])

      if (!active) return
      setStats({
        totalStudents: totalStudents.count ?? 0,
        interviewsTaken: interviewsTaken.count ?? 0,
        awaitingInterview: awaitingInterview.count ?? 0,
        trainerInterviews: trainerInterviews.count ?? 0,
      })
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [activeTrainerId])

  return { stats, loading }
}
