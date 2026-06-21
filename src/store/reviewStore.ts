import { create } from 'zustand'
import type {
  ReviewTask,
  PanelKey,
  UserPreferences,
  ReviewStats,
  AISuggestion,
  ModificationTrace,
  PacsWriteStatus,
  FinalReport
} from '../types'
import { mockTasks, mockPreferences, mockStats, mockRejectTemplates } from '../data/mock'
import dayjs from 'dayjs'

interface ReviewStore {
  tasks: ReviewTask[]
  currentTaskId: string | null
  activePanel: PanelKey
  selectedTaskIds: Set<string>
  workbasketTaskIds: Set<string>
  workbasketOrder: string[]
  preferences: UserPreferences
  stats: ReviewStats
  rejectTemplates: typeof mockRejectTemplates
  filterType: string
  filterUrgency: string
  filterStatus: string
  searchText: string
  historyFilter: { patientName?: string; accessionNumber?: string; status?: string }

  setActivePanel: (panel: PanelKey) => void
  setCurrentTask: (id: string) => void
  toggleTaskSelection: (id: string) => void
  selectAllTasks: (visibleTaskIds?: string[]) => void
  clearSelection: () => void
  setFilterType: (type: string) => void
  setFilterUrgency: (urgency: string) => void
  setFilterStatus: (status: string) => void
  setSearchText: (text: string) => void
  setHistoryFilter: (filter: Partial<ReviewStore['historyFilter']>) => void

  acceptSuggestion: (taskId: string, suggestionId: string) => void
  rejectSuggestion: (taskId: string, suggestionId: string) => void
  modifySuggestion: (taskId: string, suggestionId: string, content: string) => void

  updateFinalReport: (taskId: string, report: Partial<FinalReport>) => void
  regenerateFinalReport: (taskId: string) => void

  approveTask: (taskId: string) => Promise<void>
  rejectTask: (taskId: string, reason: string) => void
  retryPacsWrite: (taskId: string) => Promise<void>
  setPacsWriteStatus: (taskId: string, status: PacsWriteStatus, error?: string) => void

  batchApprove: (taskIds: string[]) => void
  batchReject: (taskIds: string[], reason: string) => void

  addToWorkbasket: (taskId: string) => void
  removeFromWorkbasket: (taskId: string) => void
  clearWorkbasket: () => void
  batchAddToWorkbasket: (taskIds: string[]) => void
  advanceWorkbasket: () => void

  updatePreferences: (prefs: Partial<UserPreferences>) => void
}

function generateFinalReport(task: ReviewTask): FinalReport {
  const findings = task.suggestions
    .filter((s) => s.accepted === true && s.type === 'finding')
    .map((s) => s.modifiedContent || s.content)
    .join('\n')

  const impression = task.suggestions
    .filter((s) => s.accepted === true && s.type === 'impression')
    .map((s) => s.modifiedContent || s.content)
    .join('\n')

  return {
    findings: findings || '（无影像所见）',
    impression: impression || '（无诊断意见）',
    lastModifiedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
  }
}

export const useReviewStore = create<ReviewStore>((set, get) => ({
  tasks: mockTasks.map((t) => {
    const fullTask = {
      ...t,
      pacsWriteStatus: 'idle' as PacsWriteStatus,
      finalReport: { findings: '', impression: '', lastModifiedAt: '' }
    } as ReviewTask
    return {
      ...fullTask,
      finalReport: generateFinalReport(fullTask)
    }
  }),
  currentTaskId: mockTasks[0]?.id || null,
  activePanel: 'list',
  selectedTaskIds: new Set(),
  workbasketTaskIds: new Set(),
  workbasketOrder: [],
  preferences: mockPreferences,
  stats: mockStats,
  rejectTemplates: mockRejectTemplates,
  filterType: 'all',
  filterUrgency: 'all',
  filterStatus: 'all',
  searchText: '',
  historyFilter: {},

  setActivePanel: (panel) => set({ activePanel: panel }),

  setCurrentTask: (id) => set({ currentTaskId: id }),

  toggleTaskSelection: (id) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task || task.status !== 'pending') return {}
      const newSet = new Set(state.selectedTaskIds)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { selectedTaskIds: newSet }
    }),

  selectAllTasks: (visibleTaskIds) =>
    set((state) => {
      if (visibleTaskIds) {
        const pendingVisible = visibleTaskIds.filter((id) => {
          const task = state.tasks.find((t) => t.id === id)
          return task && task.status === 'pending'
        })
        return { selectedTaskIds: new Set(pendingVisible) }
      }
      const filtered = getFiltered(state)
      return {
        selectedTaskIds: new Set(filtered.filter((t: ReviewTask) => t.status === 'pending').map((t: ReviewTask) => t.id))
      }
    }),

  clearSelection: () => set({ selectedTaskIds: new Set() }),

  setFilterType: (type) => set({ filterType: type }),
  setFilterUrgency: (urgency) => set({ filterUrgency: urgency }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSearchText: (text) => set({ searchText: text }),
  setHistoryFilter: (filter) => set((state) => ({ historyFilter: { ...state.historyFilter, ...filter } })),

  acceptSuggestion: (taskId: string, suggestionId: string) =>
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              suggestions: t.suggestions.map((s) =>
                s.id === suggestionId ? { ...s, accepted: s.accepted === true ? null : true } : s
              )
            }
          : t
      )
      const updatedTask = newTasks.find((t) => t.id === taskId)
      if (updatedTask) {
        const finalReport = generateFinalReport(updatedTask)
        return {
          tasks: newTasks.map((t) =>
            t.id === taskId ? { ...t, finalReport } : t
          )
        }
      }
      return { tasks: newTasks }
    }),

  rejectSuggestion: (taskId: string, suggestionId: string) =>
    set((state) => {
      const newTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              suggestions: t.suggestions.map((s) =>
                s.id === suggestionId ? { ...s, accepted: s.accepted === false ? null : false } : s
              )
            }
          : t
      )
      const updatedTask = newTasks.find((t) => t.id === taskId)
      if (updatedTask) {
        const finalReport = generateFinalReport(updatedTask)
        return {
          tasks: newTasks.map((t) =>
            t.id === taskId ? { ...t, finalReport } : t
          )
        }
      }
      return { tasks: newTasks }
    }),

  modifySuggestion: (taskId, suggestionId, content) =>
    set((state) => {
      const suggestion = state.tasks.find((t) => t.id === taskId)?.suggestions.find((s) => s.id === suggestionId)
      const newTasks = state.tasks.map((t) =>
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
      const updatedTask = newTasks.find((t) => t.id === taskId)
      if (updatedTask) {
        const finalReport = generateFinalReport(updatedTask)
        return {
          tasks: newTasks.map((t) =>
            t.id === taskId ? { ...t, finalReport } : t
          )
        }
      }
      return { tasks: newTasks }
    }),

  updateFinalReport: (taskId, report) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return {}
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const modifications = [...task.modifications]
      if (report.findings !== undefined && report.findings !== task.finalReport.findings) {
        modifications.push({
          id: `M${Date.now()}-F`,
          fieldName: '最终报告-影像所见',
          originalValue: task.finalReport.findings,
          modifiedValue: report.findings,
          modifiedAt: now,
          operator: '当前医生'
        } as ModificationTrace)
      }
      if (report.impression !== undefined && report.impression !== task.finalReport.impression) {
        modifications.push({
          id: `M${Date.now()}-I`,
          fieldName: '最终报告-诊断意见',
          originalValue: task.finalReport.impression,
          modifiedValue: report.impression,
          modifiedAt: now,
          operator: '当前医生'
        } as ModificationTrace)
      }
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                modifications,
                finalReport: {
                  ...t.finalReport,
                  ...report,
                  lastModifiedAt: now
                }
              }
            : t
        )
      }
    }),

  regenerateFinalReport: (taskId) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return {}
      const newFinalReport = generateFinalReport(task)
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const modifications = [...task.modifications]
      if (newFinalReport.findings !== task.finalReport.findings) {
        modifications.push({
          id: `M${Date.now()}-RF`,
          fieldName: '最终报告-影像所见',
          originalValue: task.finalReport.findings,
          modifiedValue: newFinalReport.findings,
          modifiedAt: now,
          operator: '系统重新生成'
        } as ModificationTrace)
      }
      if (newFinalReport.impression !== task.finalReport.impression) {
        modifications.push({
          id: `M${Date.now()}-RI`,
          fieldName: '最终报告-诊断意见',
          originalValue: task.finalReport.impression,
          modifiedValue: newFinalReport.impression,
          modifiedAt: now,
          operator: '系统重新生成'
        } as ModificationTrace)
      }
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, finalReport: newFinalReport, modifications } : t
        )
      }
    }),

  setPacsWriteStatus: (taskId, status, error) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, pacsWriteStatus: status, pacsWriteError: error }
          : t
      )
    })),

  approveTask: async (taskId) => {
    const state = get()
    const task = state.tasks.find((t) => t.id === taskId)
    if (!task) return

    const inWorkbasket = state.workbasketTaskIds.has(taskId)

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, pacsWriteStatus: 'writing' as PacsWriteStatus } : t
      )
    }))

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const shouldFail = Math.random() < 0.08

    if (shouldFail) {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                pacsWriteStatus: 'failed' as PacsWriteStatus,
                pacsWriteError: 'PACS 连接超时，请重试'
              }
            : t
        )
      }))
      return
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'approved',
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              pacsWriteStatus: 'success' as PacsWriteStatus
            }
          : t
      ),
      stats: {
        ...s.stats,
        todayReviewed: s.stats.todayReviewed + 1,
        todayApproved: s.stats.todayApproved + 1
      }
    }))

    if (inWorkbasket && get().preferences.autoAdvance) {
      setTimeout(() => get().advanceWorkbasket(), 300)
    }
  },

  retryPacsWrite: async (taskId) => {
    const state = get()
    const inWorkbasket = state.workbasketTaskIds.has(taskId)

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, pacsWriteStatus: 'writing' as PacsWriteStatus, pacsWriteError: undefined } : t
      )
    }))

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const shouldFail = Math.random() < 0.15

    if (shouldFail) {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                pacsWriteStatus: 'failed' as PacsWriteStatus,
                pacsWriteError: 'PACS 服务暂不可用，请稍后重试'
              }
            : t
        )
      }))
      return
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'approved',
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              pacsWriteStatus: 'success' as PacsWriteStatus
            }
          : t
      ),
      stats: {
        ...s.stats,
        todayReviewed: s.stats.todayReviewed + 1,
        todayApproved: s.stats.todayApproved + 1
      }
    }))

    if (inWorkbasket && get().preferences.autoAdvance) {
      setTimeout(() => get().advanceWorkbasket(), 300)
    }
  },

  rejectTask: (taskId, reason) => {
    const state = get()
    const inWorkbasket = state.workbasketTaskIds.has(taskId)

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'rejected',
              rejectReason: reason,
              reviewerId: 'U001',
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              pacsWriteStatus: 'idle' as PacsWriteStatus
            }
          : t
      ),
      stats: {
        ...s.stats,
        todayReviewed: s.stats.todayReviewed + 1,
        todayRejected: s.stats.todayRejected + 1
      }
    }))

    if (inWorkbasket && get().preferences.autoAdvance) {
      setTimeout(() => get().advanceWorkbasket(), 300)
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
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              pacsWriteStatus: 'success' as PacsWriteStatus
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
              reviewedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              pacsWriteStatus: 'idle' as PacsWriteStatus
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
      if (state.workbasketTaskIds.has(taskId)) return {}
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task || task.status !== 'pending') return {}
      const newSet = new Set(state.workbasketTaskIds)
      newSet.add(taskId)
      return {
        workbasketTaskIds: newSet,
        workbasketOrder: [...state.workbasketOrder, taskId]
      }
    }),

  removeFromWorkbasket: (taskId) =>
    set((state) => {
      const newSet = new Set(state.workbasketTaskIds)
      newSet.delete(taskId)
      return {
        workbasketTaskIds: newSet,
        workbasketOrder: state.workbasketOrder.filter((id) => id !== taskId)
      }
    }),

  clearWorkbasket: () => set({ workbasketTaskIds: new Set(), workbasketOrder: [] }),

  batchAddToWorkbasket: (taskIds) =>
    set((state) => {
      const newSet = new Set(state.workbasketTaskIds)
      const newOrder = [...state.workbasketOrder]
      taskIds.forEach((id) => {
        const task = state.tasks.find((t) => t.id === id)
        if (task && task.status === 'pending' && !newSet.has(id)) {
          newSet.add(id)
          newOrder.push(id)
        }
      })
      return {
        workbasketTaskIds: newSet,
        workbasketOrder: newOrder
      }
    }),

  advanceWorkbasket: () => {
    const state = get()
    const currentId = state.currentTaskId
    if (!currentId) return

    const currentIndex = state.workbasketOrder.indexOf(currentId)

    const newOrder = state.workbasketOrder.filter((id) => id !== currentId)
    const newSet = new Set(state.workbasketTaskIds)
    newSet.delete(currentId)

    let nextTaskId: string | null = null
    if (currentIndex >= 0 && currentIndex < newOrder.length) {
      nextTaskId = newOrder[currentIndex]
    } else if (newOrder.length > 0) {
      nextTaskId = newOrder[0]
    }

    set({
      workbasketOrder: newOrder,
      workbasketTaskIds: newSet,
      currentTaskId: nextTaskId
    })
  },

  updatePreferences: (prefs: Partial<UserPreferences>) =>
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

export function useWorkbasketTasks() {
  return useReviewStore((state) =>
    state.workbasketOrder
      .map((id) => state.tasks.find((t) => t.id === id))
      .filter((t): t is ReviewTask => !!t && t.status === 'pending')
  )
}

export function useHistoryTasks() {
  return useReviewStore((state) => {
    let result = state.tasks.filter((t) => t.status !== 'pending' || t.pacsWriteStatus === 'failed')
    if (state.historyFilter.patientName) {
      result = result.filter((t) => t.patientName.includes(state.historyFilter.patientName!))
    }
    if (state.historyFilter.accessionNumber) {
      result = result.filter((t) => t.accessionNumber.includes(state.historyFilter.accessionNumber!))
    }
    if (state.historyFilter.status && state.historyFilter.status !== 'all') {
      if (state.historyFilter.status === 'failed') {
        result = result.filter((t) => t.pacsWriteStatus === 'failed')
      } else {
        result = result.filter((t) => t.status === state.historyFilter.status)
      }
    }
    return result
  })
}

export { getFiltered }
