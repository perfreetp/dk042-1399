import { create } from 'zustand'
import type {
  ReviewTask,
  PanelKey,
  UserPreferences,
  ReviewStats,
  AISuggestion,
  ModificationTrace,
  PacsWriteStatus,
  FinalReport,
  FinalReportVersion,
  PacsRetryRecord,
  BatchOperationResult
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
  lastBatchResult: BatchOperationResult | null

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
  setLastBatchResult: (result: BatchOperationResult | null) => void

  acceptSuggestion: (taskId: string, suggestionId: string) => void
  rejectSuggestion: (taskId: string, suggestionId: string) => void
  modifySuggestion: (taskId: string, suggestionId: string, content: string) => void

  updateFinalReport: (taskId: string, report: Partial<FinalReport>) => void
  regenerateFinalReport: (taskId: string) => void
  restoreFinalReportVersion: (taskId: string, versionId: string) => void

  approveTask: (taskId: string) => Promise<void>
  rejectTask: (taskId: string, reason: string) => void
  retryPacsWrite: (taskId: string) => Promise<void>
  batchRetryPacs: (taskIds: string[]) => Promise<void>
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
      finalReport: { findings: '', impression: '', lastModifiedAt: '' },
      finalReportVersions: [] as FinalReportVersion[],
      pacsRetryHistory: [] as PacsRetryRecord[]
    } as ReviewTask
    const finalReport = generateFinalReport(fullTask)
    const initialVersion: FinalReportVersion = {
      id: `V${Date.now()}-0`,
      findings: finalReport.findings,
      impression: finalReport.impression,
      createdAt: finalReport.lastModifiedAt,
      createdBy: 'AI系统',
      reason: 'AI初始生成'
    }
    return {
      ...fullTask,
      finalReport,
      finalReportVersions: [initialVersion]
    }
  }),
  currentTaskId: mockTasks[0]?.id || null,
  activePanel: 'list',
  selectedTaskIds: new Set(),
  workbasketTaskIds: new Set(),
  workbasketOrder: [],
  lastBatchResult: null,
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
      const hasFindingsChange = report.findings !== undefined && report.findings !== task.finalReport.findings
      const hasImpressionChange = report.impression !== undefined && report.impression !== task.finalReport.impression
      if (!hasFindingsChange && !hasImpressionChange) return {}

      if (hasFindingsChange) {
        modifications.push({
          id: `M${Date.now()}-F`,
          fieldName: '最终报告-影像所见',
          originalValue: task.finalReport.findings,
          modifiedValue: report.findings!,
          modifiedAt: now,
          operator: '当前医生'
        } as ModificationTrace)
      }
      if (hasImpressionChange) {
        modifications.push({
          id: `M${Date.now()}-I`,
          fieldName: '最终报告-诊断意见',
          originalValue: task.finalReport.impression,
          modifiedValue: report.impression!,
          modifiedAt: now,
          operator: '当前医生'
        } as ModificationTrace)
      }

      const newFinalReport = {
        ...task.finalReport,
        ...report,
        lastModifiedAt: now
      }

      const newVersion: FinalReportVersion = {
        id: `V${Date.now()}`,
        findings: newFinalReport.findings,
        impression: newFinalReport.impression,
        createdAt: now,
        createdBy: '当前医生',
        reason: '人工编辑修改'
      }

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                modifications,
                finalReport: newFinalReport,
                finalReportVersions: [...t.finalReportVersions, newVersion]
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
      const hasFindingsChange = newFinalReport.findings !== task.finalReport.findings
      const hasImpressionChange = newFinalReport.impression !== task.finalReport.impression
      if (!hasFindingsChange && !hasImpressionChange) return {}

      if (hasFindingsChange) {
        modifications.push({
          id: `M${Date.now()}-RF`,
          fieldName: '最终报告-影像所见',
          originalValue: task.finalReport.findings,
          modifiedValue: newFinalReport.findings,
          modifiedAt: now,
          operator: '系统重新生成'
        } as ModificationTrace)
      }
      if (hasImpressionChange) {
        modifications.push({
          id: `M${Date.now()}-RI`,
          fieldName: '最终报告-诊断意见',
          originalValue: task.finalReport.impression,
          modifiedValue: newFinalReport.impression,
          modifiedAt: now,
          operator: '系统重新生成'
        } as ModificationTrace)
      }

      const newVersion: FinalReportVersion = {
        id: `V${Date.now()}`,
        findings: newFinalReport.findings,
        impression: newFinalReport.impression,
        createdAt: now,
        createdBy: '系统重新生成',
        reason: '根据采纳建议重新生成'
      }

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? { ...t, finalReport: newFinalReport, modifications, finalReportVersions: [...t.finalReportVersions, newVersion] }
            : t
        )
      }
    }),

  restoreFinalReportVersion: (taskId, versionId) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) return {}
      const version = task.finalReportVersions.find((v) => v.id === versionId)
      if (!version) return {}
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const modifications = [...task.modifications]

      if (version.findings !== task.finalReport.findings) {
        modifications.push({
          id: `M${Date.now()}-RFV`,
          fieldName: '最终报告-影像所见',
          originalValue: task.finalReport.findings,
          modifiedValue: version.findings,
          modifiedAt: now,
          operator: '当前医生'
        } as ModificationTrace)
      }
      if (version.impression !== task.finalReport.impression) {
        modifications.push({
          id: `M${Date.now()}-RIV`,
          fieldName: '最终报告-诊断意见',
          originalValue: task.finalReport.impression,
          modifiedValue: version.impression,
          modifiedAt: now,
          operator: '当前医生'
        } as ModificationTrace)
      }

      const newVersion: FinalReportVersion = {
        id: `V${Date.now()}`,
        findings: version.findings,
        impression: version.impression,
        createdAt: now,
        createdBy: '当前医生',
        reason: `恢复至版本 ${version.id.slice(0, 12)}`
      }

      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                modifications,
                finalReport: {
                  findings: version.findings,
                  impression: version.impression,
                  lastModifiedAt: now
                },
                finalReportVersions: [...t.finalReportVersions, newVersion]
              }
            : t
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
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, pacsWriteStatus: 'writing' as PacsWriteStatus } : t
      )
    }))

    await new Promise((resolve) => setTimeout(resolve, 1200))

    const shouldFail = Math.random() < 0.08

    if (shouldFail) {
      const errorMsg = 'PACS 连接超时，请重试'
      const retryRecord: PacsRetryRecord = {
        id: `R${Date.now()}`,
        attemptAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'failed',
        errorMessage: errorMsg
      }
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                pacsWriteStatus: 'failed' as PacsWriteStatus,
                pacsWriteError: errorMsg,
                pacsRetryHistory: [...t.pacsRetryHistory, retryRecord]
              }
            : t
        )
      }))
      return
    }

    const successRecord: PacsRetryRecord = {
      id: `R${Date.now()}`,
      attemptAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 'success'
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'approved',
              reviewerId: 'U001',
              reviewedAt: now,
              pacsWriteStatus: 'success' as PacsWriteStatus,
              pacsRetryHistory: [...t.pacsRetryHistory, successRecord]
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
    const task = state.tasks.find((t) => t.id === taskId)
    if (!task) return

    const inWorkbasket = state.workbasketTaskIds.has(taskId)
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, pacsWriteStatus: 'writing' as PacsWriteStatus, pacsWriteError: undefined } : t
      )
    }))

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const shouldFail = Math.random() < 0.15

    if (shouldFail) {
      const errorMsg = 'PACS 服务暂不可用，请稍后重试'
      const retryRecord: PacsRetryRecord = {
        id: `R${Date.now()}`,
        attemptAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'failed',
        errorMessage: errorMsg
      }
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                pacsWriteStatus: 'failed' as PacsWriteStatus,
                pacsWriteError: errorMsg,
                pacsRetryHistory: [...t.pacsRetryHistory, retryRecord]
              }
            : t
        )
      }))
      return
    }

    const successRecord: PacsRetryRecord = {
      id: `R${Date.now()}`,
      attemptAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: 'success'
    }

    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'approved',
              reviewerId: 'U001',
              reviewedAt: now,
              pacsWriteStatus: 'success' as PacsWriteStatus,
              pacsRetryHistory: [...t.pacsRetryHistory, successRecord]
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

  batchRetryPacs: async (taskIds) => {
    const successIds: string[] = []
    const skippedIds: { id: string; reason: string }[] = []

    for (const id of taskIds) {
      const task = get().tasks.find((t) => t.id === id)
      if (!task) {
        skippedIds.push({ id, reason: '任务不存在' })
        continue
      }
      if (task.pacsWriteStatus !== 'failed') {
        skippedIds.push({ id, reason: '非写入失败状态' })
        continue
      }
      await get().retryPacsWrite(id)
      const updatedTask = get().tasks.find((t) => t.id === id)
      if (updatedTask?.pacsWriteStatus === 'success') {
        successIds.push(id)
      } else {
        skippedIds.push({ id, reason: updatedTask?.pacsWriteError || '重试失败' })
      }
    }

    const result: BatchOperationResult = {
      type: 'retryPacs',
      successIds,
      skippedIds,
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    set({ lastBatchResult: result })
  },

  setLastBatchResult: (result) => set({ lastBatchResult: result }),

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
    set((state) => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const successIds: string[] = []
      const skippedIds: { id: string; reason: string }[] = []
      const newTasks = state.tasks.map((t) => {
        if (!taskIds.includes(t.id)) return t
        if (t.status !== 'pending') {
          skippedIds.push({ id: t.id, reason: '已处理，跳过' })
          return t
        }
        successIds.push(t.id)
        return {
          ...t,
          status: 'approved' as const,
          reviewerId: 'U001',
          reviewedAt: now,
          pacsWriteStatus: 'success' as const
        }
      })
      const result: BatchOperationResult = {
        type: 'approve',
        successIds,
        skippedIds,
        timestamp: now
      }
      return {
        tasks: newTasks,
        selectedTaskIds: new Set(),
        lastBatchResult: result,
        stats: {
          ...state.stats,
          todayReviewed: state.stats.todayReviewed + successIds.length,
          todayApproved: state.stats.todayApproved + successIds.length
        }
      }
    }),

  batchReject: (taskIds, reason) =>
    set((state) => {
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const successIds: string[] = []
      const skippedIds: { id: string; reason: string }[] = []
      const newTasks = state.tasks.map((t) => {
        if (!taskIds.includes(t.id)) return t
        if (t.status !== 'pending') {
          skippedIds.push({ id: t.id, reason: '已处理，跳过' })
          return t
        }
        successIds.push(t.id)
        return {
          ...t,
          status: 'rejected' as const,
          rejectReason: reason,
          reviewerId: 'U001',
          reviewedAt: now,
          pacsWriteStatus: 'idle' as const
        }
      })
      const result: BatchOperationResult = {
        type: 'reject',
        successIds,
        skippedIds,
        timestamp: now
      }
      return {
        tasks: newTasks,
        selectedTaskIds: new Set(),
        lastBatchResult: result,
        stats: {
          ...state.stats,
          todayReviewed: state.stats.todayReviewed + successIds.length,
          todayRejected: state.stats.todayRejected + successIds.length
        }
      }
    }),

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
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const newSet = new Set(state.workbasketTaskIds)
      const newOrder = [...state.workbasketOrder]
      const successIds: string[] = []
      const skippedIds: { id: string; reason: string }[] = []
      taskIds.forEach((id) => {
        const task = state.tasks.find((t) => t.id === id)
        if (!task) {
          skippedIds.push({ id, reason: '任务不存在' })
          return
        }
        if (task.status !== 'pending') {
          skippedIds.push({ id, reason: '已处理，跳过' })
          return
        }
        if (newSet.has(id)) {
          skippedIds.push({ id, reason: '已在工作篮中' })
          return
        }
        newSet.add(id)
        newOrder.push(id)
        successIds.push(id)
      })
      const result: BatchOperationResult = {
        type: 'addWorkbasket',
        successIds,
        skippedIds,
        timestamp: now
      }
      return {
        workbasketTaskIds: newSet,
        workbasketOrder: newOrder,
        lastBatchResult: result
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
