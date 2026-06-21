import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Tooltip,
  Divider,
  Empty,
  Input,
  Select,
  Checkbox,
  Progress,
  List,
  Avatar,
  Badge,
  Alert,
  App as AntdApp,
  Typography,
  Tabs
} from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  QuestionOutlined,
  FileTextOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SaveOutlined,
  SendOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CopyOutlined,
  WarningOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  DiffOutlined
} from '@ant-design/icons'
import { useReviewStore, useCurrentTask, useFilteredTasks } from '../store/reviewStore'
import type { AISuggestion, ExamType, UrgencyLevel, FinalReportVersion } from '../types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Text, Paragraph } = Typography

const examTypeLabels: Record<ExamType, string> = {
  CT: 'CT',
  MRI: 'MRI',
  DR: 'DR',
  US: '超声',
  'PET-CT': 'PET-CT',
  DSA: 'DSA'
}

const urgencyLabels: Record<UrgencyLevel, { label: string; color: string }> = {
  routine: { label: '常规', color: '#64748b' },
  urgent: { label: '加急', color: '#f59e0b' },
  emergency: { label: '急诊', color: '#ef4444' }
}

const suggestionTypeLabels: Record<AISuggestion['type'], { label: string; color: string }> = {
  finding: { label: '影像所见', color: '#0ea5e9' },
  impression: { label: '诊断意见', color: '#8b5cf6' },
  recommendation: { label: '处理建议', color: '#10b981' }
}

function SuggestionCard({ suggestion, taskId }: { suggestion: AISuggestion; taskId: string }) {
  const { acceptSuggestion, rejectSuggestion, modifySuggestion, preferences } = useReviewStore()
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(suggestion.modifiedContent || suggestion.content)

  const cfg = suggestionTypeLabels[suggestion.type]

  const handleSave = () => {
    modifySuggestion(taskId, suggestion.id, editContent)
    setEditing(false)
  }

  const handleReset = () => {
    setEditContent(suggestion.content)
    modifySuggestion(taskId, suggestion.id, suggestion.content)
    setEditing(false)
  }

  const getStatusIcon = () => {
    if (suggestion.accepted === true) return <CheckCircleOutlined style={{ color: '#10b981' }} />
    if (suggestion.accepted === false) return <CloseCircleOutlined style={{ color: '#ef4444' }} />
    return <QuestionOutlined style={{ color: '#64748b' }} />
  }

  const getStatusLabel = () => {
    if (suggestion.accepted === true) return { text: '已采纳', color: '#10b981' }
    if (suggestion.accepted === false) return { text: '已拒绝', color: '#ef4444' }
    return { text: '待决定', color: '#64748b' }
  }

  const status = getStatusLabel()

  return (
    <div
      style={{
        padding: 14,
        borderRadius: 6,
        background: '#334155',
        borderLeft: `3px solid ${cfg.color}`,
        marginBottom: 12,
        opacity: suggestion.accepted === false ? 0.6 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={cfg.color} style={{ margin: 0, fontSize: 11 }}>
            {cfg.label}
          </Tag>
          {preferences.showConfidence && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Progress
                percent={Math.round(suggestion.aiConfidence * 100)}
                size="small"
                style={{ width: 60 }}
                showInfo={false}
                strokeColor={
                  suggestion.aiConfidence >= 0.9
                    ? '#10b981'
                    : suggestion.aiConfidence >= 0.8
                    ? '#f59e0b'
                    : '#ef4444'
                }
              />
              <span style={{ fontSize: 11, color: '#64748b' }}>{Math.round(suggestion.aiConfidence * 100)}%</span>
            </span>
          )}
          {suggestion.isModified && (
            <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
              <EditOutlined style={{ fontSize: 10 }} /> 已修改
            </Tag>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: status.color }}>{status.text}</span>
          <Space size={4}>
            <Tooltip title={suggestion.accepted === true ? '取消采纳' : '采纳此建议'}>
              <Button
                size="small"
                type={suggestion.accepted === true ? 'primary' : 'text'}
                icon={<CheckOutlined />}
                onClick={() => acceptSuggestion(taskId, suggestion.id)}
                style={{
                  color: suggestion.accepted === true ? '#fff' : '#10b981',
                  background: suggestion.accepted === true ? '#10b981' : 'transparent'
                }}
              />
            </Tooltip>
            <Tooltip title={suggestion.accepted === false ? '取消拒绝' : '拒绝此建议'}>
              <Button
                size="small"
                type={suggestion.accepted === false ? 'primary' : 'text'}
                icon={<CloseOutlined />}
                onClick={() => rejectSuggestion(taskId, suggestion.id)}
                style={{
                  color: suggestion.accepted === false ? '#fff' : '#ef4444',
                  background: suggestion.accepted === false ? '#ef4444' : 'transparent'
                }}
              />
            </Tooltip>
            <Tooltip title={editing ? '取消编辑' : '编辑内容'}>
              <Button
                size="small"
                type="text"
                icon={editing ? <CloseOutlined /> : <EditOutlined />}
                onClick={() => {
                  setEditing(!editing)
                  if (editing) setEditContent(suggestion.modifiedContent || suggestion.content)
                }}
                style={{ color: '#94a3b8' }}
              />
            </Tooltip>
          </Space>
        </div>
      </div>

      {editing ? (
        <div>
          <TextArea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            autoSize={{ minRows: 3, maxRows: 8 }}
            style={{ fontSize: 13, lineHeight: 1.7 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <Button size="small" icon={<RollbackOutlined />} onClick={handleReset} disabled={editContent === suggestion.content}>
              还原
            </Button>
            <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              保存修改
            </Button>
          </div>
        </div>
      ) : (
        <Paragraph
          style={{
            fontSize: 13,
            color: suggestion.accepted === false ? '#64748b' : '#f1f5f9',
            marginBottom: 0,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap'
          }}
        >
          {suggestion.modifiedContent || suggestion.content}
        </Paragraph>
      )}

      {suggestion.isModified && !editing && (
        <div style={{ marginTop: 10, padding: 10, background: '#1e293b', borderRadius: 4 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
            <InfoCircleOutlined /> AI 原始内容：
          </div>
          <Paragraph
            type="secondary"
            style={{ fontSize: 12, color: '#64748b', marginBottom: 0, textDecoration: 'line-through', lineHeight: 1.6 }}
          >
            {suggestion.content}
          </Paragraph>
        </div>
      )}
    </div>
  )
}

function ConfirmPanel() {
  const {
    tasks,
    setCurrentTask,
    setActivePanel,
    approveTask,
    rejectTask,
    retryPacsWrite,
    updateFinalReport,
    regenerateFinalReport,
    restoreFinalReportVersion,
    rejectTemplates,
    preferences,
    workbasketTaskIds,
    workbasketOrder
  } = useReviewStore()
  const currentTask = useCurrentTask()
  const filteredTasks = useFilteredTasks()
  const { message, modal } = AntdApp.useApp()

  const [rejectReason, setRejectReason] = useState('')
  const [customRejectReason, setCustomRejectReason] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [activeTab, setActiveTab] = useState('suggestions')
  const [editingFindings, setEditingFindings] = useState(false)
  const [editingImpression, setEditingImpression] = useState(false)
  const [editFindings, setEditFindings] = useState('')
  const [editImpression, setEditImpression] = useState('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const pendingIndex = pendingTasks.findIndex((t) => t.id === currentTask?.id)

  const workbasketTasks = workbasketOrder
    .map((id) => tasks.find((t) => t.id === id))
    .filter((t): t is typeof tasks[0] => !!t && t.status === 'pending')
  const currentWorkbasketIndex = workbasketOrder.indexOf(currentTask?.id || '')

  const handlePrev = () => {
    if (pendingIndex > 0) setCurrentTask(pendingTasks[pendingIndex - 1].id)
  }
  const handleNext = () => {
    if (pendingIndex < pendingTasks.length - 1) setCurrentTask(pendingTasks[pendingIndex + 1].id)
  }

  const categories = ['全部', ...Array.from(new Set(rejectTemplates.map((t) => t.category)))]

  const filteredTemplates = rejectTemplates.filter(
    (t) => selectedCategory === '全部' || t.category === selectedCategory
  )

  const handleApprove = () => {
    if (!currentTask) return
    const hasPending = currentTask.suggestions.some((s) => s.accepted === null)
    if (hasPending) {
      modal.confirm({
        title: '存在未决定的建议',
        icon: <WarningOutlined style={{ color: '#f59e0b' }} />,
        content: (
          <div>
            <p>部分 AI 建议尚未决定是否采纳，未决定的建议将默认不写入正式报告。</p>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
              未决定: {currentTask.suggestions.filter((s) => s.accepted === null).length} 条 |
              已采纳: {currentTask.suggestions.filter((s) => s.accepted === true).length} 条 |
              已拒绝: {currentTask.suggestions.filter((s) => s.accepted === false).length} 条
            </p>
          </div>
        ),
        okText: '继续确认写入',
        cancelText: '返回审核',
        onOk: () => doApprove()
      })
    } else {
      doApprove()
    }
  }

  const doApprove = async () => {
    if (!currentTask) return
    setRejectReason('')
    setCustomRejectReason('')
    await approveTask(currentTask.id)
  }

  const handleRetryWrite = async () => {
    if (!currentTask) return
    await retryPacsWrite(currentTask.id)
  }

  const handleReject = () => {
    if (!currentTask) return
    const finalReason = customRejectReason || rejectReason
    if (!finalReason) {
      message.warning('请选择或填写驳回原因')
      return
    }
    modal.confirm({
      title: '确认驳回',
      icon: <CloseCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div>
          <p>此报告将被驳回，不会写入 PACS。</p>
          <div style={{ marginTop: 8, padding: 10, background: '#0f172a', borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>驳回原因：</div>
            <div style={{ fontSize: 12, color: '#ef4444' }}>{finalReason}</div>
          </div>
        </div>
      ),
      okText: '确认驳回',
      cancelText: '取消',
      okButtonProps: { type: 'primary', danger: true },
      onOk: () => {
        rejectTask(currentTask.id, finalReason)
        message.success('报告已驳回')
        setRejectReason('')
        setCustomRejectReason('')
      }
    })
  }

  if (!currentTask) {
    return (
      <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Empty description="请从待审列表选择一份报告" />
      </div>
    )
  }

  const acceptedCount = currentTask.suggestions.filter((s) => s.accepted === true).length
  const rejectedCount = currentTask.suggestions.filter((s) => s.accepted === false).length
  const pendingCount = currentTask.suggestions.filter((s) => s.accepted === null).length
  const modificationCount = currentTask.modifications.length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #475569',
          background: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => setActivePanel('compare')} style={{ color: '#94a3b8' }}>
            返回影像
          </Button>
          <Divider type="vertical" style={{ height: 24, background: '#475569' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{currentTask.patientName}</span>
              <Tag color={urgencyLabels[currentTask.urgency].color} style={{ margin: 0 }}>
                {urgencyLabels[currentTask.urgency].label}
              </Tag>
              <span style={{ color: '#64748b', fontSize: 12 }}>
                {examTypeLabels[currentTask.examType]} · {currentTask.examBodyPart} · {currentTask.accessionNumber}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={handlePrev} disabled={pendingIndex <= 0} size="small">
            上一份
          </Button>
          <span style={{ color: '#64748b', fontSize: 12, minWidth: 60, textAlign: 'center' }}>
            {pendingIndex + 1} / {pendingTasks.length}
          </span>
          <Button icon={<ArrowRightOutlined />} onClick={handleNext} disabled={pendingIndex >= pendingTasks.length - 1} size="small">
            下一份
          </Button>
        </div>
      </div>

      {workbasketTasks.length > 0 && (
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid #475569',
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto'
          }}
        >
          <span style={{ color: '#8b5cf6', fontSize: 12, whiteSpace: 'nowrap' }}>
            <FolderOpenOutlined /> 工作篮 ({workbasketTasks.length}):
          </span>
          {workbasketTasks.map((task, index) => (
            <Button
              key={task.id}
              size="small"
              type={currentTask?.id === task.id ? 'primary' : 'default'}
              onClick={() => setCurrentTask(task.id)}
              style={{
                background: currentTask?.id === task.id ? '#8b5cf6' : 'transparent',
                borderColor: currentTask?.id === task.id ? '#8b5cf6' : '#475569',
                whiteSpace: 'nowrap',
                minWidth: 100
              }}
            >
              <span style={{ fontSize: 10, color: '#64748b', marginRight: 4 }}>{index + 1}.</span>
              {task.patientName}
              {task.isEmergency && <span style={{ color: '#ef4444', marginLeft: 4 }}>!</span>}
            </Button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '10px 20px',
              borderBottom: '1px solid #475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1e293b'
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="small"
              style={{ marginBottom: 0 }}
              items={[
                {
                  key: 'suggestions',
                  label: (
                    <span>
                      <FileTextOutlined /> AI 报告建议
                      <Badge
                        count={pendingCount}
                        size="small"
                        offset={[4, -2]}
                        style={{ backgroundColor: pendingCount > 0 ? '#f59e0b' : '#10b981', marginLeft: 6 }}
                      />
                    </span>
                  )
                },
                {
                  key: 'preview',
                  label: (
                    <span>
                      <SendOutlined /> 写入预览
                      {acceptedCount > 0 && (
                        <Tag color="green" style={{ fontSize: 10, padding: '0 4px', marginLeft: 6 }}>
                          {acceptedCount}条采纳
                        </Tag>
                      )}
                    </span>
                  )
                },
                {
                  key: 'modifications',
                  label: (
                    <span>
                      <HistoryOutlined /> 修改痕迹
                      {modificationCount > 0 && (
                        <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', marginLeft: 6 }}>
                          {modificationCount}
                        </Tag>
                      )}
                    </span>
                  )
                }
              ]}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                <span style={{ color: '#10b981' }}>
                  <CheckOutlined /> 采纳 {acceptedCount}
                </span>
                <span style={{ color: '#ef4444' }}>
                  <CloseOutlined /> 拒绝 {rejectedCount}
                </span>
                <span style={{ color: '#64748b' }}>
                  <QuestionOutlined /> 待决定 {pendingCount}
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, padding: 20, overflow: 'auto', background: '#0f172a' }}>
            {activeTab === 'suggestions' ? (
              <>
                {currentTask.suggestions.length > 0 ? (
                  currentTask.suggestions.map((s) => (
                    <SuggestionCard key={s.id} suggestion={s} taskId={currentTask.id} />
                  ))
                ) : (
                  <Empty description="AI未生成报告建议" style={{ padding: 40 }} />
                )}

                <Alert
                  type="info"
                  showIcon
                  icon={<InfoCircleOutlined />}
                  message="操作提示"
                  description={
                    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                      <div>• 点击 <CheckCircleOutlined style={{ color: '#10b981' }} /> 采纳此建议，内容将写入正式报告</div>
                      <div>• 点击 <CloseCircleOutlined style={{ color: '#ef4444' }} /> 拒绝此建议，内容不会写入报告</div>
                      <div>• 点击 <EditOutlined /> 可编辑建议内容，修改后会保留原始内容作为痕迹</div>
                      <div>• 键盘快捷键：空格切换采纳状态</div>
                    </div>
                  }
                  style={{ marginTop: 20, background: 'transparent', border: '1px dashed #475569' }}
                />
              </>
            ) : activeTab === 'preview' ? (
              <div>
                {currentTask.pacsWriteStatus === 'writing' && (
                  <Alert
                    type="info"
                    showIcon
                    icon={<Progress type="circle" percent={100} size={24} status="active" />}
                    message="正在写入 PACS 系统..."
                    description="请稍候，报告内容正在同步到影像归档系统。写入期间请勿关闭页面。"
                    style={{ marginBottom: 16, background: 'rgba(14,165,233,0.1)', border: '1px solid #0ea5e9' }}
                  />
                )}
                {currentTask.pacsWriteStatus === 'success' && (
                  <Alert
                    type="success"
                    showIcon
                    icon={<CheckCircleOutlined />}
                    message="PACS 写入成功"
                    description={`报告已于 ${currentTask.reviewedAt} 成功写入 PACS 系统。`}
                    style={{ marginBottom: 16 }}
                  />
                )}
                {currentTask.pacsWriteStatus === 'failed' && (
                  <Alert
                    type="error"
                    showIcon
                    icon={<CloseCircleOutlined />}
                    message={`PACS 写入失败：${currentTask.pacsWriteError || '未知错误'}`}
                    description="审核决定已保留，点击右侧「重试写入」按钮重新提交，无需重新采纳建议。"
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Card
                  size="small"
                  className="panel-card"
                  style={{ border: 'none', marginBottom: 16 }}
                  title={
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      <FileTextOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />
                      最终报告（写入前可微调）
                    </span>
                  }
                  extra={
                    <Space>
                      <Tooltip title="根据采纳建议重新生成">
                        <Button
                          size="small"
                          icon={<RollbackOutlined />}
                          onClick={() => regenerateFinalReport(currentTask.id)}
                          disabled={currentTask.pacsWriteStatus === 'writing'}
                        >
                          重新生成
                        </Button>
                      </Tooltip>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        最后更新: {currentTask.finalReport.lastModifiedAt}
                      </span>
                    </Space>
                  }
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="blue" style={{ margin: 0 }}>影像所见</Tag>
                        {acceptedCount > 0 && (
                          <span style={{ color: '#64748b' }}>基于 {acceptedCount} 条采纳内容</span>
                        )}
                      </div>
                      {!editingFindings ? (
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditFindings(currentTask.finalReport.findings)
                            setEditingFindings(true)
                          }}
                          disabled={currentTask.pacsWriteStatus !== 'idle' && currentTask.pacsWriteStatus !== 'failed'}
                        >
                          编辑
                        </Button>
                      ) : (
                        <Space size={4}>
                          <Button
                            size="small"
                            onClick={() => setEditingFindings(false)}
                          >
                            取消
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => {
                              updateFinalReport(currentTask.id, { findings: editFindings })
                              setEditingFindings(false)
                              message.success('影像所见已更新')
                            }}
                          >
                            保存
                          </Button>
                        </Space>
                      )}
                    </div>
                    {editingFindings ? (
                      <TextArea
                        value={editFindings}
                        onChange={(e) => setEditFindings(e.target.value)}
                        rows={6}
                        autoSize={{ minRows: 4, maxRows: 10 }}
                        style={{ fontSize: 13, lineHeight: 1.7 }}
                      />
                    ) : (
                      <Paragraph
                        style={{
                          padding: 14,
                          background: '#1e293b',
                          borderRadius: 4,
                          borderLeft: '3px solid #0ea5e9',
                          fontSize: 13,
                          color: '#f1f5f9',
                          marginBottom: 0,
                          lineHeight: 1.8,
                          whiteSpace: 'pre-wrap',
                          minHeight: 60
                        }}
                      >
                        {currentTask.finalReport.findings}
                      </Paragraph>
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag color="purple" style={{ margin: 0 }}>诊断意见</Tag>
                      </div>
                      {!editingImpression ? (
                        <Button
                          size="small"
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditImpression(currentTask.finalReport.impression)
                            setEditingImpression(true)
                          }}
                          disabled={currentTask.pacsWriteStatus !== 'idle' && currentTask.pacsWriteStatus !== 'failed'}
                        >
                          编辑
                        </Button>
                      ) : (
                        <Space size={4}>
                          <Button
                            size="small"
                            onClick={() => setEditingImpression(false)}
                          >
                            取消
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => {
                              updateFinalReport(currentTask.id, { impression: editImpression })
                              setEditingImpression(false)
                              message.success('诊断意见已更新')
                            }}
                          >
                            保存
                          </Button>
                        </Space>
                      )}
                    </div>
                    {editingImpression ? (
                      <TextArea
                        value={editImpression}
                        onChange={(e) => setEditImpression(e.target.value)}
                        rows={4}
                        autoSize={{ minRows: 3, maxRows: 8 }}
                        style={{ fontSize: 13, lineHeight: 1.7 }}
                      />
                    ) : (
                      <Paragraph
                        style={{
                          padding: 14,
                          background: '#1e293b',
                          borderRadius: 4,
                          borderLeft: '3px solid #8b5cf6',
                          fontSize: 13,
                          color: '#f1f5f9',
                          marginBottom: 0,
                          lineHeight: 1.8,
                          whiteSpace: 'pre-wrap',
                          minHeight: 50
                        }}
                      >
                        {currentTask.finalReport.impression}
                      </Paragraph>
                    )}
                  </div>
                </Card>

                <Card
                  size="small"
                  className="panel-card"
                  style={{ border: 'none', marginBottom: 16 }}
                  title={
                    <span style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer' }} onClick={() => setShowVersionHistory(!showVersionHistory)}>
                      <ClockCircleOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />
                      报告版本历史（{currentTask.finalReportVersions.length}个版本）
                      <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                        {showVersionHistory ? '点击收起' : '点击展开'}
                      </Text>
                    </span>
                  }
                >
                  {showVersionHistory && (
                    <div>
                      {currentTask.finalReportVersions.slice().reverse().map((v, idx) => {
                        const isCurrent = idx === 0
                        const isComparing = compareVersionId === v.id
                        return (
                          <div
                            key={v.id}
                            style={{
                              padding: '10px 12px',
                              background: isComparing ? '#1e3a5f' : '#1e293b',
                              borderRadius: 4,
                              marginBottom: 8,
                              borderLeft: `3px solid ${isCurrent ? '#10b981' : '#475569'}`
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <Space size={8}>
                                {isCurrent && <Tag color="green" style={{ margin: 0, fontSize: 10 }}>当前版本</Tag>}
                                <Tag color={v.createdBy === '当前医生' ? 'purple' : 'blue'} style={{ margin: 0, fontSize: 10 }}>
                                  {v.createdBy}
                                </Tag>
                                <Text style={{ fontSize: 11, color: '#94a3b8' }}>{v.createdAt}</Text>
                              </Space>
                              <Space size={4}>
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<DiffOutlined />}
                                  onClick={() => setCompareVersionId(isComparing ? null : v.id)}
                                >
                                  {isComparing ? '关闭对比' : '对比'}
                                </Button>
                                {!isCurrent && (
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<RollbackOutlined />}
                                    onClick={() => {
                                      modal.confirm({
                                        title: '确认恢复此版本？',
                                        content: `恢复到 ${v.createdAt} 的版本，当前版本会被保存为新版本。`,
                                        okText: '确认恢复',
                                        cancelText: '取消',
                                        onOk: () => {
                                          restoreFinalReportVersion(currentTask.id, v.id)
                                          message.success('已恢复到该版本')
                                          setCompareVersionId(null)
                                        }
                                      })
                                    }}
                                    disabled={currentTask.pacsWriteStatus === 'writing'}
                                  >
                                    恢复
                                  </Button>
                                )}
                              </Space>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                              {v.reason}
                            </div>
                            {isComparing && (
                              <div style={{ padding: 10, background: '#0f172a', borderRadius: 4 }}>
                                <div style={{ marginBottom: 8 }}>
                                  <Tag color="blue" style={{ marginBottom: 6, fontSize: 10 }}>影像所见对比</Tag>
                                  <div style={{ fontSize: 12, color: '#f1f5f9', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: 8, background: '#1e293b', borderRadius: 4 }}>
                                    {v.findings}
                                  </div>
                                </div>
                                <div>
                                  <Tag color="purple" style={{ marginBottom: 6, fontSize: 10 }}>诊断意见对比</Tag>
                                  <div style={{ fontSize: 12, color: '#f1f5f9', lineHeight: 1.7, whiteSpace: 'pre-wrap', padding: 8, background: '#1e293b', borderRadius: 4 }}>
                                    {v.impression}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>

                <Card
                  size="small"
                  className="panel-card"
                  style={{ border: 'none', marginBottom: 16 }}
                  title={
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      <SendOutlined style={{ color: '#10b981', marginRight: 6 }} />
                      详细内容对比
                    </span>
                  }
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircleOutlined style={{ color: '#10b981' }} />
                      采纳详情（将写入正式报告）
                      <Tag color="green" style={{ marginLeft: 'auto' }}>{acceptedCount}条采纳</Tag>
                    </div>
                    {currentTask.suggestions.filter((s) => s.accepted === true).length > 0 ? (
                      <div style={{ padding: 16, background: '#1e293b', borderRadius: 4, borderLeft: '3px solid #10b981' }}>
                        {currentTask.suggestions
                          .filter((s) => s.accepted === true)
                          .map((s) => (
                            <div key={s.id} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <Tag color={suggestionTypeLabels[s.type].color} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                                  {suggestionTypeLabels[s.type].label}
                                </Tag>
                                {s.isModified && (
                                  <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                                    <EditOutlined /> 人工修改
                                  </Tag>
                                )}
                              </div>
                              <div style={{ fontSize: 13, color: '#f1f5f9', lineHeight: 1.7, paddingLeft: 4 }}>
                                {s.modifiedContent || s.content}
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <Alert
                        type="warning"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        message="暂无采纳内容"
                        description="请先在「AI报告建议」页面对建议进行处理"
                        style={{ background: 'transparent', border: '1px dashed #475569' }}
                      />
                    )}
                  </div>

                  {rejectedCount > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CloseCircleOutlined style={{ color: '#ef4444' }} />
                        已拒绝内容（不会写入报告）
                        <Tag color="error" style={{ marginLeft: 'auto' }}>{rejectedCount}条拒绝</Tag>
                      </div>
                      <div style={{ padding: 16, background: '#1e293b', borderRadius: 4, borderLeft: '3px solid #ef4444', opacity: 0.7 }}>
                        {currentTask.suggestions
                          .filter((s) => s.accepted === false)
                          .map((s) => (
                            <div key={s.id} style={{ marginBottom: 12, textDecoration: 'line-through' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <Tag color={suggestionTypeLabels[s.type].color} style={{ fontSize: 10, padding: '0 4px', margin: 0, opacity: 0.5 }}>
                                  {suggestionTypeLabels[s.type].label}
                                </Tag>
                              </div>
                              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, paddingLeft: 4 }}>
                                {s.modifiedContent || s.content}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {pendingCount > 0 && (
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <QuestionOutlined style={{ color: '#f59e0b' }} />
                        待决定内容（默认不写入报告）
                        <Tag color="warning" style={{ marginLeft: 'auto' }}>{pendingCount}条待决定</Tag>
                      </div>
                      <Alert
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        message={`还有 ${pendingCount} 条建议尚未决定`}
                        description="请返回「AI报告建议」页面对这些建议进行处理"
                        style={{ background: 'transparent', border: '1px dashed #f59e0b' }}
                      />
                    </div>
                  )}
                </Card>

                {modificationCount > 0 && (
                  <Card
                    size="small"
                    className="panel-card"
                    style={{ border: 'none' }}
                    title={
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        <EditOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />
                        人工修改记录
                        <Tag color="purple" style={{ fontSize: 10, marginLeft: 8 }}>{modificationCount}处修改</Tag>
                      </span>
                    }
                  >
                    <List
                      size="small"
                      dataSource={currentTask.modifications}
                      renderItem={(item) => (
                        <List.Item style={{ background: '#1e293b', marginBottom: 8, borderRadius: 4, padding: '12px 16px' }}>
                          <List.Item.Meta
                            avatar={<Avatar size="small" style={{ background: '#8b5cf6', fontSize: 12 }}>修</Avatar>}
                            title={
                              <span style={{ fontSize: 12, color: '#f1f5f9' }}>
                                修改了「{item.suggestionType ? suggestionTypeLabels[item.suggestionType].label : '报告'}」内容
                              </span>
                            }
                            description={
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                                <div style={{ textDecoration: 'line-through', marginBottom: 4 }}>原文：{item.originalValue}</div>
                                <div style={{ color: '#10b981' }}>修改：{item.modifiedValue}</div>
                                <div style={{ marginTop: 4, fontSize: 10 }}>{item.modifiedAt} · {item.operator}</div>
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
              </div>
            ) : (
              <Card className="panel-card" style={{ border: 'none' }} size="small" title="审核修改记录">
                {currentTask.modifications.length > 0 ? (
                  <List
                    dataSource={currentTask.modifications}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              size={32}
                              style={{ background: '#8b5cf6', fontSize: 12 }}
                              icon={<EditOutlined />}
                            />
                          }
                          title={
                            <span style={{ fontSize: 13, color: '#f1f5f9' }}>
                              {item.fieldName}
                              <Tag color="purple" style={{ fontSize: 10, marginLeft: 8 }}>内容修改</Tag>
                            </span>
                          }
                          description={
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                                {item.operator} · {item.modifiedAt}
                              </div>
                              <div style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', marginBottom: 4 }}>
                                原：{item.originalValue}
                              </div>
                              <div style={{ fontSize: 12, color: '#10b981' }}>改：{item.modifiedValue}</div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无修改记录" style={{ padding: 40 }} />
                )}
              </Card>
            )}
          </div>
        </div>

        <div
          style={{
            width: 360,
            borderLeft: '1px solid #475569',
            background: '#1e293b',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #475569' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9', marginBottom: 4 }}>审核确认</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>确认报告内容后，选择通过写入或驳回</div>
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
                <CloseCircleOutlined style={{ color: '#ef4444', marginRight: 4 }} />
                常见驳回原因
              </div>

              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                size="small"
                style={{ width: '100%', marginBottom: 12 }}
                options={categories.map((c) => ({ value: c, label: c }))}
              />

              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {filteredTemplates.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setRejectReason(t.content)
                      setCustomRejectReason(t.content)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 4,
                      background: rejectReason === t.content ? 'rgba(239,68,68,0.15)' : '#334155',
                      border: rejectReason === t.content ? '1px solid #ef4444' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Tag color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {t.category}
                      </Tag>
                      <span style={{ fontSize: 10, color: '#64748b' }}>使用 {t.usageCount} 次</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#f1f5f9', lineHeight: 1.6 }}>{t.content}</div>
                  </div>
                ))}
              </Space>

              <Divider style={{ margin: '16px 0', borderColor: '#475569' }} />

              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                自定义驳回原因
              </div>
              <TextArea
                value={customRejectReason}
                onChange={(e) => setCustomRejectReason(e.target.value)}
                placeholder="请输入或选择驳回原因..."
                rows={3}
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid #475569',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <div
              style={{
                padding: 12,
                background: '#334155',
                borderRadius: 6
              }}
            >
              <Row gutter={8}>
                <Col span={8}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>采纳</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#10b981' }}>{acceptedCount}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>拒绝</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>{rejectedCount}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>修改</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#8b5cf6' }}>{modificationCount}</div>
                </Col>
              </Row>
            </div>

            {currentTask.pacsWriteStatus === 'writing' && (
              <Alert
                type="info"
                showIcon
                icon={<Progress type="circle" percent={100} size={20} status="active" />}
                message="写入中..."
                style={{ background: 'rgba(14,165,233,0.1)', border: 'none' }}
              />
            )}
            {currentTask.pacsWriteStatus === 'success' && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="已成功写入 PACS"
                style={{ background: 'rgba(16,185,129,0.1)', border: 'none' }}
              />
            )}
            {currentTask.pacsWriteStatus === 'failed' && (
              <Alert
                type="error"
                showIcon
                icon={<CloseCircleOutlined />}
                message="写入失败，可重试"
                style={{ background: 'rgba(239,68,68,0.1)', border: 'none' }}
              />
            )}

            <Button
              type="primary"
              danger
              size="large"
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              disabled={currentTask.status !== 'pending' || currentTask.pacsWriteStatus === 'writing'}
            >
              驳回此报告
            </Button>
            {currentTask.pacsWriteStatus === 'failed' ? (
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleRetryWrite}
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              >
                重试写入 PACS
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleApprove}
                loading={currentTask.pacsWriteStatus === 'writing'}
                disabled={currentTask.status !== 'pending' || currentTask.pacsWriteStatus === 'success'}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                {currentTask.pacsWriteStatus === 'success' ? '已成功写入' : '通过并写入 PACS'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmPanel
