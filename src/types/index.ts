export type ExamType = 'CT' | 'MRI' | 'DR' | 'US' | 'PET-CT' | 'DSA'

export type ReviewStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'timeout'

export type UrgencyLevel = 'routine' | 'urgent' | 'emergency'

export interface LesionMeasurement {
  id: string
  name: string
  previousValue?: number
  currentValue: number
  unit: string
  changePercent?: number
  isSignificant: boolean
  location: string
}

export interface AISuggestion {
  id: string
  type: 'finding' | 'impression' | 'recommendation'
  content: string
  aiConfidence: number
  accepted: boolean | null
  modifiedContent?: string
  isModified: boolean
}

export interface ModificationTrace {
  id: string
  fieldName: string
  originalValue: string
  modifiedValue: string
  modifiedAt: string
  operator: string
}

export interface RejectTemplate {
  id: string
  category: string
  content: string
  usageCount: number
}

export interface ReviewTask {
  id: string
  patientId: string
  patientName: string
  age: number
  gender: '男' | '女'
  examType: ExamType
  examBodyPart: string
  accessionNumber: string
  studyDate: string
  urgency: UrgencyLevel
  aiAnalyzedAt: string
  waitingMinutes: number
  previousExamId?: string
  previousExamDate?: string
  status: ReviewStatus
  aiSummary: string
  aiConfidence: number
  hasAbnormal: boolean
  lesions: LesionMeasurement[]
  suggestions: AISuggestion[]
  modifications: ModificationTrace[]
  reviewerId?: string
  reviewedAt?: string
  rejectReason?: string
  originalImageUrl: string
  aiAnnotatedImageUrl: string
}

export interface ReviewStats {
  todayReviewed: number
  todayApproved: number
  todayRejected: number
  avgReviewMinutes: number
  weeklyData: { date: string; count: number; avgTime: number }[]
  byExamType: { type: ExamType; count: number; approvalRate: number }[]
}

export interface UserPreferences {
  defaultView: 'split' | 'original' | 'ai'
  autoAdvance: boolean
  showChangeHighlight: boolean
  showConfidence: boolean
  keyboardShortcuts: Record<string, string>
  commonRejectReasons: string[]
  reviewReminderMinutes: number
}

export type PanelKey = 'list' | 'compare' | 'confirm' | 'batch' | 'preference'
