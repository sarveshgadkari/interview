import { jsPDF } from 'jspdf'
import type { StudentWithRelations } from '../hooks/useStudents'
import type { InterviewWithScorecard } from '../hooks/useStudentDetail'
import { formatDate, scorePercent } from './format'

const MARGIN = 14
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

export function exportStudentReportPdf(
  student: StudentWithRelations,
  interviews: InterviewWithScorecard[],
) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > 285) {
      doc.addPage()
      y = MARGIN
    }
  }

  const heading = (text: string, size = 16) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(size)
    doc.setTextColor(20, 20, 20)
    doc.text(text, MARGIN, y)
    y += size * 0.5
  }

  const label = (text: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(90, 90, 90)
    doc.text(text, MARGIN, y)
    y += 5
  }

  const line = () => {
    doc.setDrawColor(210, 210, 210)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 6
  }

  heading('Panel — Interview Report', 18)
  y += 2
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated ${formatDate(new Date().toISOString())}`, MARGIN, y)
  y += 8

  heading(student.name, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const infoLines = [
    `Email: ${student.email ?? '—'}    Phone: ${student.phone ?? '—'}`,
    `Track: ${student.interview_types?.name ?? 'Unassigned'}    Trainer: ${student.trainers?.name ?? 'Unassigned'}`,
    `Status: ${student.status}    Applied: ${formatDate(student.applied_date)}`,
  ]
  for (const l of infoLines) {
    doc.text(l, MARGIN, y)
    y += 5
  }
  if (student.notes) {
    const notesText = doc.splitTextToSize(`Notes: ${student.notes}`, CONTENT_WIDTH)
    doc.text(notesText, MARGIN, y)
    y += notesText.length * 5
  }
  y += 4
  line()

  if (interviews.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(11)
    doc.setTextColor(120, 120, 120)
    doc.text('No interviews recorded yet.', MARGIN, y)
  }

  for (const interview of interviews) {
    ensureSpace(50)
    heading(
      `${formatDate(interview.date)} — ${interview.interview_types?.name ?? 'Unassigned'} (${interview.interview_mode ?? '—'})`,
      12,
    )
    label(
      `Trainer: ${interview.trainers?.name ?? '—'}    Verdict: ${interview.verdict || 'No verdict'}    Score: ${scorePercent(interview.total_score, interview.max_score)}%`,
    )

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    doc.text('Marking Scheme', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    if (interview.marking_scores?.length > 0) {
      const markingText = doc.splitTextToSize(
        interview.marking_scores.map((m) => `${m.criterion}: ${m.score}/5`).join('    '),
        CONTENT_WIDTH,
      )
      doc.text(markingText, MARGIN, y)
      y += markingText.length * 4.5 + 2.5
    } else {
      doc.text('—', MARGIN, y)
      y += 7
    }

    if (interview.interview_scorecard_items.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Question Scorecard', MARGIN, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      for (const item of interview.interview_scorecard_items) {
        ensureSpace(12)
        const text = doc.splitTextToSize(
          `[${item.score}/5] ${item.question_text_snapshot ?? ''}${item.notes ? ` — ${item.notes}` : ''}`,
          CONTENT_WIDTH,
        )
        doc.text(text, MARGIN, y)
        y += text.length * 4.5 + 1
      }
      y += 2
    }

    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.text('What went well', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const strengthsText = doc.splitTextToSize(
      interview.strengths || '—',
      CONTENT_WIDTH,
    )
    doc.text(strengthsText, MARGIN, y)
    y += strengthsText.length * 4.5 + 3

    ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.text('What needs improvement', MARGIN, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    const improvementsText = doc.splitTextToSize(
      interview.improvements || '—',
      CONTENT_WIDTH,
    )
    doc.text(improvementsText, MARGIN, y)
    y += improvementsText.length * 4.5 + 4

    line()
  }

  doc.save(`${student.name.replace(/\s+/g, '_')}_interview_report.pdf`)
}
