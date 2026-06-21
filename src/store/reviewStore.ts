import { create } from 'zustand'
import type { ReviewTask, PanelKey, UserPreferences, ReviewStats, AISuggestion, ModificationTrace } from '../types'
import { mockTasks, mockPreferences, mockStats, mockRejectTemplates } from '../data/mock'
import dayjs from 'dayjs'

interface ReviewStore {
  tasks: ReviewTask[]
  currentTaskId: string | null
  activePanel: PanelKey
  selectedTaskIds: Set<string>
  workbasketTaskIds: Set<string>
  preferences: UserPreferences
  stats: ReviewStats
  rejectTemplates: typeof mockRejectTemplates
  filterType: string
  filterUrgency: string
  filterStatus: string
  searchText: string

  setActivePanel: (panel: PanelKey) => void
  setCurrentTask: (id: string) => void
  toggleTaskSelection: (id: string) => void
  selectAllTasks: () => void
  clearSelection: () => void
  setFilterType: (type: string) => void
  setFilterUrgency: (urgency: string) => void
  setFilterStatus: (status: string) => void
  setSearchText: (text: string) => void

  acceptSuggestion: (taskId: string, suggestionId: string) => void
  rejectSuggestion: (taskId: string, suggestionId: string) => void
  modifySuggestion: (taskId: string, suggestionId: string, content: string) => void
  approveTask: (taskId: string) => void
  rejectTask: (taskId: string, reason: string) => void
  batchApprove: (taskIds: string[]) => void
  batchReject: (taskIds: string[], reason: string) => void

  addToWorkbasket: (taskId: string) => void
  removeFromWorkbasket: (taskId: string) => void
  clearWorkbasket: () => void
  batchAddToWorkbasket: (taskIds: string[]) => void
  advanceWorkbasket: () => void

  updatePreferences: (prefs: Partial<UserPreferences>) => void
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  tasks: mockTasks,
  currentTaskId: mockTasks[0]?.id || null,
  activePanel: 'list',
  selectedTaskIds: new Set(),
  workbasketTaskIds: new Set(),
  preferences: mockPreferences,
  stats: mockStats,
  rejectTemplates: mockRejectTemplates,
  filterType: 'all',
  filterUrgency: 'all',
  filterStatus: 'all',
  searchText: '',

  setActivePanel: (panel) => set({ activePanel: panel }),

  setCurrentTask: (id) => set({ currentTaskId: id }),

  toggleTaskSelection: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedTaskIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedTaskIds: newSet }
    }),

  selectAllTasks: () => {
    const filtered = getFiltered(get())
    set({ selectedTaskIds: new Set(filtered.map((t: ReviewTask) => t.id)) })
  },

  clearSelection: () => set({ selectedTaskIds: new Set() }),

  setFilterType: (type) => set({ filterType: type }),
  setFilterUrgency: (urgency) => set({ filterUrgency: urgency }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchText: (text) => set({ searchText: text }),

  acceptSuggestion: (taskId: string, suggestionId: string) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              suggestions: t.suggestions.map((s) =>
                s.id === suggestionId
                  ? { ...s, accepted: s.accepted === true ? null : true }
                  : s
              )
            }
          : t
      )
    })),

  rejectSuggestion: (taskId: string, suggestionId: string) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              suggestions: t.suggestions.map((s) =>
                s.id === suggestionId
                  ? { ...s, accepted: s.accepted === false ? null : false }
                  : s
              )
            }
          : t
      )
    })),

  modifySuggestion: (taskId, suggestionId, content) =>
    set((state) => {
      const suggestion = state.tasks.find((t) => t.id === taskId)?.suggestions.find((s) => s.id === suggestionId)
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                suggestions: t.suggestions.map((s) =>
                  s.id === suggestionId
                    ? {
                        ...s,
                        modifiedContent: content,
                        isModified: content !== s.content,
                        accepted: content !== s.content ? true : s.accepted
                      }
                    : s
                ),
                modifications: [
                  ...t.modifications,
                  {
                    id: `M${Date.now()}`,
                    fieldName: '报告建议',
                    originalValue: suggestion?.content || '',
                    modifiedValue: content,
                    modifiedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    operator: '当前医生',
                    suggestionType: suggestion?.type || 'finding'
                  } as ModificationTrace
                ]
              }
            : t
        )
      }
    }),

  approveTask: (taskId) => {
    const state = get()
    const inWorkbasket = state.workbasketTaskIds.has(taskId)
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'approved',
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
          : t
      ),
      stats: {
        ...state.stats,
        todayReviewed: state.stats.todayReviewed + 1,
        todayApproved: state.stats.todayApproved + 1
      }
    }))
    if (inWorkbasket && get().preferences.autoAdvance) {
      setTimeout(() => get().advanceWorkbasket(), 100)
    }
  },

  rejectTask: (taskId, reason) => {
    const state = get()
    const inWorkbasket = state.workbasketTaskIds.has(taskId)
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'rejected',
              rejectReason: reason,
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
          : t
      ),
      stats: {
        ...state.stats,
        todayReviewed: state.stats.todayReviewed + 1,
        todayRejected: state.stats.todayRejected + 1
      }
    }))
    if (inWorkbasket && get().preferences.autoAdvance) {
      setTimeout(() => get().advanceWorkbasket(), 100)
    }
  },

  batchApprove: (taskIds) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        taskIds.includes(t.id)
          ? {
              ...t,
              status: 'approved',
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
          : t
      ),
      selectedTaskIds: new Set(),
      stats: {
        ...state.stats,
        todayReviewed: state.stats.todayReviewed + taskIds.length,
        todayApproved: state.stats.todayApproved + taskIds.length
      }
    })),

  batchReject: (taskIds, reason) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        taskIds.includes(t.id)
          ? {
              ...t,
              status: 'rejected',
              rejectReason: reason,
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
            }
          : t
      ),
      selectedTaskIds: new Set(),
      stats: {
        ...state.stats,
        todayReviewed: state.stats.todayReviewed + taskIds.length,
        todayRejected: state.stats.todayRejected + taskIds.length
      }
    })),

  addToWorkbasket: (taskId) =>
    set((state) => {
      const newSet = new Set(state.workbasketTaskIds)
      newSet.add(taskId)
      return { workbasketTaskIds: newSet }
    }),

  removeFromWorkbasket: (taskId) =>
    set((state) => {
      const newSet = new Set(state.workbasketTaskIds)
      newSet.delete(taskId)
      return { workbasketTaskIds: newSet }
    }),

  clearWorkbasket: () => set({ workbasketTaskIds: new Set() }),

  batchAddToWorkbasket: (taskIds) =>
    set((state) => {
      const newSet = new Set(state.workbasketTaskIds)
      taskIds.forEach((id) => newSet.add(id))
      return { workbasketTaskIds: newSet }
    }),

  advanceWorkbasket: () => {
    const state = get()
    const workbasketArray = Array.from(state.workbasketTaskIds)
    const currentIndex = workbasketArray.indexOf(state.currentTaskId || '')
    if (currentIndex >= 0 && currentIndex < workbasketArray.length - 1) {
      const nextTaskId = workbasketArray[currentIndex + 1]
      const newSet = new Set(state.workbasketTaskIds)
      newSet.delete(state.currentTaskId || '')
      set({
        workbasketTaskIds: newSet,
        currentTaskId: nextTaskId
      })
    } else if (currentIndex >= 0) {
      const newSet = new Set(state.workbasketTaskIds)
      newSet.delete(state.currentTaskId || '')
      set({ workbasketTaskIds: newSet })
    }
  },

  updatePreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs }
    }))
}))

function getFiltered(state: ReturnType<typeof useReviewStore.getState>) {
  return state.tasks.filter((t) => {
    if (state.filterType !== 'all' && t.examType !== state.filterType) return false
    if (state.filterUrgency !== 'all' && t.urgency !== state.filterUrgency) return false
    if (state.filterStatus !== 'all' && t.status !== state.filterStatus) return false
    if (state.searchText) {
      const search = state.searchText.toLowerCase()
      if (
        !t.patientName.toLowerCase().includes(search) &&
        !t.patientId.toLowerCase().includes(search) &&
        !t.accessionNumber.toLowerCase().includes(search)
      ) {
        return false
      }
    }
    return true
  })
}

export function useFilteredTasks() {
  return useReviewStore((state) => getFiltered(state))
}

export function useCurrentTask() {
  return useReviewStore((state) => state.tasks.find((t) => t.id === state.currentTaskId) || null)
}

export { getFiltered }
