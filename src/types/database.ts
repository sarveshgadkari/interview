export type UserRole = 'admin_interviewer' | 'manager'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export type InterviewMode = 'Mock Interview' | 'Final Interview'

export type StudentStatus =
  | 'New'
  | 'Interviewed'
  | 'Selected'
  | 'Rejected'
  | 'Needs Retest'

export type Verdict = 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire' | ''

export type MarkingScoreEntry = {
  criterion: string
  score: number
}

export type InterviewType = {
  id: string
  name: string
  archived: boolean
  marking_criteria: string[]
  created_at: string
}

export type Trainer = {
  id: string
  name: string
  created_at: string
}

export type Student = {
  id: string
  name: string
  email: string | null
  phone: string | null
  type_id: string | null
  trainer_id: string | null
  interview_mode: InterviewMode
  status: StudentStatus
  applied_date: string
  notes: string | null
  created_at: string
}

export type Question = {
  id: string
  type_id: string | null
  difficulty: Difficulty
  question_text: string
  ideal_answer: string | null
  created_at: string
}

export type Interview = {
  id: string
  student_id: string
  type_id: string | null
  trainer_id: string | null
  interview_mode: string | null
  date: string
  total_score: number
  max_score: number
  marking_scores: MarkingScoreEntry[]
  strengths: string | null
  improvements: string | null
  verdict: Verdict | null
  created_at: string
}

export type InterviewScorecardItem = {
  id: string
  interview_id: string
  question_id: string | null
  question_text_snapshot: string | null
  score: number
  notes: string | null
}

export type Profile = {
  id: string
  full_name: string | null
  role: UserRole
}

// Minimal Supabase Database type map used for typed client calls.
export type Database = {
  public: {
    Tables: {
      interview_types: {
        Row: InterviewType
        Insert: Partial<InterviewType> & { name: string }
        Update: Partial<InterviewType>
        Relationships: []
      }
      trainers: {
        Row: Trainer
        Insert: Partial<Trainer> & { name: string }
        Update: Partial<Trainer>
        Relationships: []
      }
      students: {
        Row: Student
        Insert: Partial<Student> & { name: string }
        Update: Partial<Student>
        Relationships: []
      }
      questions: {
        Row: Question
        Insert: Partial<Question> & { question_text: string }
        Update: Partial<Question>
        Relationships: []
      }
      interviews: {
        Row: Interview
        Insert: Partial<Interview> & { student_id: string }
        Update: Partial<Interview>
        Relationships: []
      }
      interview_scorecard_items: {
        Row: InterviewScorecardItem
        Insert: Partial<InterviewScorecardItem> & { interview_id: string }
        Update: Partial<InterviewScorecardItem>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
