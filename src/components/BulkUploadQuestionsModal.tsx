import { useMemo, useRef, useState } from 'react'
import Modal from './ui/Modal'
import Badge from './ui/Badge'
import { parseDelimitedText } from '../utils/csv'
import type { Difficulty, InterviewType } from '../types/database'
import { difficultyStyles } from '../utils/format'

const EXAMPLE = `type,difficulty,question,answer
MERN Stack,Easy,What is the virtual DOM?,A lightweight in-memory representation of the real DOM used to batch updates.
MERN Stack,Medium,Explain the event loop in Node.js,Covers the call stack, callback queue, and microtasks.`

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function buildTemplateCsv(types: InterviewType[]) {
  const typeName = types[0]?.name ?? 'MERN Stack'
  const rows = [
    ['type', 'difficulty', 'question', 'answer'],
    [typeName, 'Easy', 'What is the virtual DOM?', 'A lightweight in-memory representation of the real DOM used to batch updates.'],
    [typeName, 'Medium', 'Explain the event loop in Node.js', 'Covers the call stack, callback queue, and microtasks.'],
    [typeName, 'Hard', 'How would you design a rate limiter for an API?', 'Discusses token bucket / sliding window approaches and distributed considerations.'],
  ]
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

function downloadTemplate(types: InterviewType[]) {
  const csv = buildTemplateCsv(types)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'question-bank-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

interface ParsedRow {
  line: number
  typeId: string | null
  typeLabel: string
  difficulty: Difficulty
  question_text: string
  ideal_answer: string
  error: string | null
}

function normalizeHeader(cell: string) {
  return cell.trim().toLowerCase().replace(/[\s_]+/g, '')
}

function matchDifficulty(raw: string): Difficulty | null {
  const v = raw.trim().toLowerCase()
  if (!v) return null
  if (v.startsWith('e')) return 'Easy'
  if (v.startsWith('m')) return 'Medium'
  if (v.startsWith('h')) return 'Hard'
  return null
}

export default function BulkUploadQuestionsModal({
  open,
  onClose,
  types,
  defaultTypeId,
  onImport,
}: {
  open: boolean
  onClose: () => void
  types: InterviewType[]
  defaultTypeId: string
  onImport: (
    rows: {
      type_id: string
      difficulty: Difficulty
      question_text: string
      ideal_answer?: string
    }[],
  ) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [fallbackTypeId, setFallbackTypeId] = useState(defaultTypeId)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const typeByName = useMemo(() => {
    const map = new Map<string, InterviewType>()
    for (const t of types) map.set(t.name.trim().toLowerCase(), t)
    return map
  }, [types])

  const parsedRows = useMemo<ParsedRow[]>(() => {
    const table = parseDelimitedText(text)
    if (table.length === 0) return []

    const header = table[0].map(normalizeHeader)
    const colType = header.findIndex((h) => ['type', 'interviewtype', 'track'].includes(h))
    const colDifficulty = header.findIndex((h) => h === 'difficulty')
    const colQuestion = header.findIndex((h) =>
      ['question', 'questiontext', 'questions'].includes(h),
    )
    const colAnswer = header.findIndex((h) =>
      ['answer', 'idealanswer', 'idealanswers'].includes(h),
    )

    if (colQuestion === -1) {
      return [
        {
          line: 1,
          typeId: null,
          typeLabel: '',
          difficulty: 'Medium',
          question_text: '',
          ideal_answer: '',
          error:
            'No "question" column found in the header row. See the format example below.',
        },
      ]
    }

    return table.slice(1).map((cells, idx) => {
      const questionText = (cells[colQuestion] ?? '').trim()
      const typeRaw = colType >= 0 ? (cells[colType] ?? '').trim() : ''
      const difficultyRaw = colDifficulty >= 0 ? (cells[colDifficulty] ?? '') : ''
      const idealAnswer = colAnswer >= 0 ? (cells[colAnswer] ?? '').trim() : ''

      let typeId: string | null = null
      let typeLabel = ''
      let error: string | null = null

      if (typeRaw) {
        const match = typeByName.get(typeRaw.toLowerCase())
        if (match) {
          typeId = match.id
          typeLabel = match.name
        } else {
          error = `Unknown type "${typeRaw}"`
        }
      } else if (fallbackTypeId) {
        const fallback = types.find((t) => t.id === fallbackTypeId)
        typeId = fallbackTypeId
        typeLabel = fallback?.name ?? ''
      } else {
        error = 'No type specified and no default type selected'
      }

      if (!questionText && !error) error = 'Missing question text'

      return {
        line: idx + 2,
        typeId,
        typeLabel,
        difficulty: matchDifficulty(difficultyRaw) ?? 'Medium',
        question_text: questionText,
        ideal_answer: idealAnswer,
        error,
      }
    })
  }, [text, typeByName, types, fallbackTypeId])

  const validRows = parsedRows.filter((r) => !r.error && r.typeId)
  const invalidRows = parsedRows.filter((r) => r.error)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setSubmitError(null)
    setSubmitting(true)
    try {
      await onImport(
        validRows.map((r) => ({
          type_id: r.typeId as string,
          difficulty: r.difficulty,
          question_text: r.question_text,
          ideal_answer: r.ideal_answer || undefined,
        })),
      )
      setText('')
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Import failed')
    }
    setSubmitting(false)
  }

  const handleClose = () => {
    setText('')
    setSubmitError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk Upload Questions"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <div>
          <label className="panel-label">Default type (used for rows without a type column)</label>
          <select
            className="panel-input"
            value={fallbackTypeId}
            onChange={(e) => setFallbackTypeId(e.target.value)}
          >
            <option value="">No default — require a type column</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="panel-label mb-0">Paste CSV / TSV, or upload a file</label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => downloadTemplate(types)}
              >
                Download Template
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload file
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </div>
          <textarea
            className="panel-input min-h-32 font-mono text-xs"
            placeholder={EXAMPLE}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-cream-dim mt-1.5">
            First row must be a header. Recognized columns:{' '}
            <span className="font-mono">type</span> (optional, matches an existing
            interview type by name), <span className="font-mono">difficulty</span>{' '}
            (Easy/Medium/Hard, defaults to Medium), <span className="font-mono">question</span>{' '}
            (required), <span className="font-mono">answer</span> (optional). Works with
            data copied straight from a spreadsheet.
          </p>
        </div>

        {parsedRows.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-teal/15 text-teal">{validRows.length} ready</Badge>
              {invalidRows.length > 0 && (
                <Badge className="bg-danger/15 text-danger">
                  {invalidRows.length} skipped
                </Badge>
              )}
            </div>
            <div className="panel-card max-h-64 overflow-y-auto divide-y divide-border-soft">
              {parsedRows.map((row) => (
                <div
                  key={row.line}
                  className="flex items-start gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="font-mono text-cream-dim text-xs mt-0.5 w-8 shrink-0">
                    #{row.line}
                  </span>
                  {row.error ? (
                    <div className="min-w-0">
                      <p className="text-danger text-xs">{row.error}</p>
                      {row.question_text && (
                        <p className="text-cream-dim truncate">{row.question_text}</p>
                      )}
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge className={difficultyStyles[row.difficulty]}>
                          {row.difficulty}
                        </Badge>
                        <span className="text-xs text-teal">{row.typeLabel}</span>
                      </div>
                      <p className="text-cream truncate">{row.question_text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {submitError && (
          <div className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-[10px] px-3 py-2">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={validRows.length === 0 || submitting}
            onClick={handleImport}
          >
            {submitting ? 'Importing…' : `Import ${validRows.length || ''} Question${validRows.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
