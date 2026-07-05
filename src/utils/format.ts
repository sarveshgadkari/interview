import type { Difficulty, StudentStatus, Verdict } from '../types/database'

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const statusStyles: Record<StudentStatus, string> = {
  New: 'bg-teal/15 text-teal',
  Interviewed: 'bg-cream-dim/15 text-cream-dim',
  Selected: 'bg-amber/15 text-amber',
  Rejected: 'bg-danger/15 text-danger',
  'Needs Retest': 'bg-teal-dim/20 text-teal',
}

export const verdictStyles: Record<string, string> = {
  'Strong Hire': 'bg-amber/20 text-amber',
  Hire: 'bg-teal/15 text-teal',
  'No Hire': 'bg-danger/10 text-danger',
  'Strong No Hire': 'bg-danger/20 text-danger',
  '': 'bg-cream-dim/10 text-cream-dim',
}

export const difficultyStyles: Record<Difficulty, string> = {
  Easy: 'bg-teal/15 text-teal',
  Medium: 'bg-amber/15 text-amber',
  Hard: 'bg-danger/15 text-danger',
}

export function verdictToStatus(verdict: Verdict | null | undefined): StudentStatus {
  if (verdict === 'Hire' || verdict === 'Strong Hire') return 'Selected'
  if (verdict === 'No Hire' || verdict === 'Strong No Hire') return 'Rejected'
  return 'Interviewed'
}

export function scorePercent(total: number, max: number) {
  if (!max) return 0
  return Math.round((total / max) * 100)
}
