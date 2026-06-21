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
  WarningOutlined
} from '@ant-design/icons'
import { useReviewStore, useCurrentTask, useFilteredTasks } from '../store/reviewStore'
import type { AISuggestion, ExamType, UrgencyLevel } from '../types'
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
  const { toggleSuggestion, modifySuggestion, preferences } = useReviewStore()
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
            <Tooltip title="采纳此建议">
              <Button
                size="small"
                type={suggestion.accepted === true ? 'primary' : 'text'}
                icon={<CheckOutlined />}
                onClick={() => toggleSuggestion(taskId, suggestion.id)}
                style={{
                  color: suggestion.accepted === true ? '#fff' : '#10b981',
                  background: suggestion.accepted === true ? '#10b981' : 'transparent'
                }}
              />
            </Tooltip>
            <Tooltip title="拒绝此建议">
              <Button
                size="small"
                type={suggestion.accepted === false ? 'primary' : 'text'}
                icon={<CloseOutlined />}
                onClick={() => toggleSuggestion(taskId, suggestion.id)}
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
    rejectTemplates,
    preferences
  } = useReviewStore()
  const currentTask = useCurrentTask()
  const filteredTasks = useFilteredTasks()
  const { message, modal } = AntdApp.useApp()

  const [rejectReason, setRejectReason] = useState('')
  const [customRejectReason, setCustomRejectReason] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [activeTab, setActiveTab] = useState('suggestions')

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const pendingIndex = pendingTasks.findIndex((t) => t.id === currentTask?.id)

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

  const doApprove = () => {
    if (!currentTask) return
    modal.confirm({
      title: '确认写入 PACS',
      icon: <SendOutlined />,
      content: (
        <div>
          <p>以下内容将作为正式报告写入 PACS 系统：</p>
          <div style={{ padding: 12, background: '#0f172a', borderRadius: 4, marginTop: 8 }}>
            {currentTask.suggestions
              .filter((s) => s.accepted === true)
              .map((s) => (
                <div key={s.id} style={{ fontSize: 12, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.6 }}>
                  <Tag color={suggestionTypeLabels[s.type].color} style={{ fontSize: 10, padding: '0 4px' }}>
                    {suggestionTypeLabels[s.type].label}
                  </Tag>
                  <span style={{ marginLeft: 6 }}>{s.modifiedContent || s.content}</span>
                </div>
              ))}
            {currentTask.suggestions.filter((s) => s.accepted === true).length === 0 && (
              <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 10 }}>（无采纳内容）</div>
            )}
          </div>
        </div>
      ),
      okText: '确认写入',
      cancelText: '取消',
      okButtonProps: { type: 'primary' },
      onOk: () => {
        approveTask(currentTask.id)
        message.success('报告已通过并写入 PACS')
        if (preferences.autoAdvance && pendingIndex < pendingTasks.length - 1) {
          setCurrentTask(pendingTasks[pendingIndex + 1].id)
          setRejectReason('')
          setCustomRejectReason('')
        }
      }
    })
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
        if (preferences.autoAdvance && pendingIndex < pendingTasks.length - 1) {
          setCurrentTask(pendingTasks[pendingIndex + 1].id)
          setRejectReason('')
          setCustomRejectReason('')
        }
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

            <Button
              type="primary"
              danger
              size="large"
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              disabled={currentTask.status !== 'pending'}
            >
              驳回此报告
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleApprove}
              disabled={currentTask.status !== 'pending'}
              style={{ background: '#10b981', borderColor: '#10b981' }}
            >
              通过并写入 PACS
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmPanel
