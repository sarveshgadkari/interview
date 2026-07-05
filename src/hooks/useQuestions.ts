import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Difficulty, Question } from '../types/database'

export interface QuestionWithType extends Question {
  interview_types: { name: string } | null
}

export interface QuestionFilters {
  typeId?: string
  difficulty?: Difficulty | ''
}

export function useQuestions(filters: QuestionFilters = {}) {
  const [questions, setQuestions] = useState<QuestionWithType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('questions')
      .select('*, interview_types(name)')
      .order('created_at', { ascending: false })

    if (filters.typeId) query = query.eq('type_id', filters.typeId)
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)

    const { data, error } = await query
    if (error) setError(error.message)
    else setQuestions((data as QuestionWithType[]) ?? [])
    setLoading(false)
  }, [filters.typeId, filters.difficulty])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createQuestion = useCallback(
    async (input: {
      type_id: string
      difficulty: Difficulty
      question_text: string
      ideal_answer?: string
    }) => {
      const { error } = await supabase.from('questions').insert(input)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const updateQuestion = useCallback(
    async (
      id: string,
      input: Partial<{
        type_id: string
        difficulty: Difficulty
        question_text: string
        ideal_answer: string
      }>,
    ) => {
      const { error } = await supabase
        .from('questions')
        .update(input)
        .eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const deleteQuestion = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', id)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  const createQuestions = useCallback(
    async (
      inputs: {
        type_id: string
        difficulty: Difficulty
        question_text: string
        ideal_answer?: string
      }[],
    ) => {
      if (inputs.length === 0) return
      const { error } = await supabase.from('questions').insert(inputs)
      if (error) throw error
      await refresh()
    },
    [refresh],
  )

  return {
    questions,
    loading,
    error,
    refresh,
    createQuestion,
    createQuestions,
    updateQuestion,
    deleteQuestion,
  }
}
