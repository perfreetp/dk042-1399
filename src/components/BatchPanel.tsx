import { useState, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Tooltip,
  Divider,
  Table,
  Checkbox,
  Select,
  Alert,
  App as AntdApp,
  Empty,
  Statistic,
  Progress,
  Input,
  Modal,
  List,
  Badge
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClusterOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  CheckSquareOutlined,
  ClearOutlined,
  EyeOutlined,
  SendOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  FolderOpenOutlined,
  MinusOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useReviewStore, useFilteredTasks } from '../store/reviewStore'
import type { ReviewTask, ExamType, UrgencyLevel } from '../types'

const { TextArea } = Input

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

interface BatchRule {
  id: string
  name: string
  description: string
  filter: (t: ReviewTask) => boolean
  danger: boolean
  icon: React.ReactNode
}

function BatchPanel() {
  const {
    tasks,
    selectedTaskIds,
    toggleTaskSelection,
    selectAllTasks,
    clearSelection,
    setCurrentTask,
    setActivePanel,
    batchApprove,
    batchReject,
    preferences,
    rejectTemplates,
    workbasketTaskIds,
    batchAddToWorkbasket,
    addToWorkbasket,
    removeFromWorkbasket,
    clearWorkbasket
  } = useReviewStore()
  const filteredTasks = useFilteredTasks()
  const { message, modal } = AntdApp.useApp()

  const [activeTab, setActiveTab] = useState<'rules' | 'workbasket'>('rules')
  const [batchType, setBatchType] = useState<'CT' | 'MRI' | 'DR' | 'US' | 'all'>('all')
  const [minConfidence, setMinConfidence] = useState(90)
  const [onlyNormal, setOnlyNormal] = useState(false)
  const [onlyUrgent, setOnlyUrgent] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const timeoutTasks = pendingTasks.filter((t) => t.waitingMinutes >= preferences.reviewReminderMinutes)
  const workbasketTasks = tasks.filter((t) => workbasketTaskIds.has(t.id) && t.status === 'pending')

  const batchRules: BatchRule[] = [
    {
      id: 'normal-high-conf',
      name: '高置信度正常报告',
      description: 'AI置信度≥90%、未见异常、无病灶检出',
      icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
      danger: false,
      filter: (t) => t.aiConfidence >= 0.9 && !t.hasAbnormal && t.lesions.length === 0
    },
    {
      id: 'dr-normal',
      name: 'DR 平片正常',
      description: 'DR检查、AI置信度≥95%、未见异常',
      icon: <CheckCircleOutlined style={{ color: '#10b981' }} />,
      danger: false,
      filter: (t) => t.examType === 'DR' && t.aiConfidence >= 0.95 && !t.hasAbnormal
    },
    {
      id: 'timeout-normal',
      name: '超时正常报告',
      description: `等待超过${preferences.reviewReminderMinutes}分钟、AI置信度≥90%、未见异常`,
      icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />,
      danger: false,
      filter: (t) =>
        t.waitingMinutes >= preferences.reviewReminderMinutes && t.aiConfidence >= 0.9 && !t.hasAbnormal
    },
    {
      id: 'emergency-normal',
      name: '急诊绿色通道',
      description: '急诊检查、AI置信度≥95%、未见异常（快速放行）',
      icon: <ThunderboltOutlined style={{ color: '#ef4444' }} />,
      danger: true,
      filter: (t) => t.urgency === 'emergency' && t.aiConfidence >= 0.95 && !t.hasAbnormal
    }
  ]

  const smartFiltered = useMemo(() => {
    return pendingTasks.filter((t) => {
      if (batchType !== 'all' && t.examType !== batchType) return false
      if (t.aiConfidence * 100 < minConfidence) return false
      if (onlyNormal && t.hasAbnormal) return false
      if (onlyUrgent && t.urgency === 'routine') return false
      return true
    })
  }, [pendingTasks, batchType, minConfidence, onlyNormal, onlyUrgent])

  const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id) && t.status === 'pending')

  const handleSelectRule = (rule: BatchRule) => {
    const matched = pendingTasks.filter(rule.filter)
    if (matched.length === 0) {
      message.info('当前没有符合该规则的待审任务')
      return
    }
    matched.forEach((t) => {
      if (!selectedTaskIds.has(t.id)) toggleTaskSelection(t.id)
    })
    message.success(`已选中 ${matched.length} 份符合"${rule.name}"规则的报告`)
  }

  const handleSelectSmartFiltered = () => {
    if (smartFiltered.length === 0) {
      message.info('当前没有符合筛选条件的待审任务')
      return
    }
    clearSelection()
    smartFiltered.forEach((t) => toggleTaskSelection(t.id))
    message.success(`已选中 ${smartFiltered.length} 份报告`)
  }

  const handleBatchApprove = () => {
    if (selectedTasks.length === 0) {
      message.warning('请先选择要批量通过的报告')
      return
    }
    const hasAbnormal = selectedTasks.some((t) => t.hasAbnormal)
    const lowConf = selectedTasks.some((t) => t.aiConfidence < 0.85)

    modal.confirm({
      title: `确认批量通过 ${selectedTasks.length} 份报告？`,
      icon: <SendOutlined />,
      content: (
        <div>
          <p>以下报告将批量通过并写入 PACS：</p>
          <div style={{ padding: 12, background: '#0f172a', borderRadius: 4, marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
            {selectedTasks.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #334155' }}>
                <span style={{ fontSize: 12, color: '#f1f5f9' }}>
                  {t.patientName} · {examTypeLabels[t.examType]}{t.examBodyPart}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {t.hasAbnormal && (
                    <Tag color="orange" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>异常</Tag>
                  )}
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                    {Math.round(t.aiConfidence * 100)}%
                  </span>
                </span>
              </div>
            ))}
          </div>
          {(hasAbnormal || lowConf) && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={
                <span style={{ fontSize: 12 }}>
                  其中含{hasAbnormal ? '有异常发现' : ''}{hasAbnormal && lowConf ? '、' : ''}
                  {lowConf ? '低置信度' : ''}报告，建议人工确认后再批量操作
                </span>
              }
            />
          )}
        </div>
      ),
      okText: `确认写入 ${selectedTasks.length} 份`,
      cancelText: '取消',
      okButtonProps: { type: 'primary' },
      onOk: () => {
        batchApprove(selectedTasks.map((t) => t.id))
        message.success(`成功批量通过 ${selectedTasks.length} 份报告并写入 PACS`)
      }
    })
  }

  const handleConfirmReject = () => {
    if (!rejectReason) {
      message.warning('请填写驳回原因')
      return
    }
    modal.confirm({
      title: `确认批量驳回 ${selectedTasks.length} 份报告？`,
      icon: <CloseCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div>
          <p>以下报告将被批量驳回，不会写入 PACS：</p>
          <div style={{ padding: 12, background: '#0f172a', borderRadius: 4, marginTop: 8, maxHeight: 150, overflow: 'auto' }}>
            {selectedTasks.map((t) => (
              <div key={t.id} style={{ padding: '4px 0', borderBottom: '1px solid #334155', fontSize: 12, color: '#f1f5f9' }}>
                {t.patientName} · {examTypeLabels[t.examType]}{t.examBodyPart} · {t.accessionNumber}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>驳回原因：</div>
            <div style={{ fontSize: 12, color: '#ef4444' }}>{rejectReason}</div>
          </div>
        </div>
      ),
      okText: `确认驳回 ${selectedTasks.length} 份`,
      cancelText: '取消',
      okButtonProps: { type: 'primary', danger: true },
      onOk: () => {
        batchReject(selectedTasks.map((t) => t.id), rejectReason)
        message.success(`成功批量驳回 ${selectedTasks.length} 份报告`)
        setShowRejectModal(false)
        setRejectReason('')
      }
    })
  }

  const columns = [
    {
      title: <Checkbox checked={selectedTasks.length === pendingTasks.length && pendingTasks.length > 0}
        onChange={(e) => e.target.checked ? selectAllTasks() : clearSelection()}
      />,
      dataIndex: 'select',
      width: 45,
      fixed: 'left' as const,
      render: (_: unknown, record: ReviewTask) => (
        <Checkbox
          checked={selectedTaskIds.has(record.id)}
          onChange={() => toggleTaskSelection(record.id)}
          onClick={(e) => e.stopPropagation()}
        />
      )
    },
    {
      title: '优先级',
      dataIndex: 'urgency',
      width: 70,
      render: (urgency: UrgencyLevel) => {
        const cfg = urgencyLabels[urgency]
        return (
          <Tag color={cfg.color} style={{ margin: 0, fontSize: 11 }}>
            {cfg.label}
          </Tag>
        )
      }
    },
    {
      title: '患者',
      dataIndex: 'patientName',
      width: 140,
      render: (_: string, record: ReviewTask) => (
        <div>
          <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>{record.patientName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {record.gender} · {record.age}岁
          </div>
        </div>
      )
    },
    {
      title: '检查',
      dataIndex: 'examType',
      width: 100,
      render: (type: ExamType, record: ReviewTask) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {examTypeLabels[type]} · {record.examBodyPart}
        </span>
      )
    },
    {
      title: 'AI结果',
      dataIndex: 'hasAbnormal',
      width: 100,
      render: (hasAbnormal: boolean, record: ReviewTask) => (
        <div>
          <div style={{ fontSize: 12, color: hasAbnormal ? '#f59e0b' : '#10b981', marginBottom: 4 }}>
            {hasAbnormal ? '发现异常' : '未见异常'}
          </div>
          <Progress
            percent={Math.round(record.aiConfidence * 100)}
            size="small"
            showInfo={false}
            style={{ width: 70 }}
            strokeColor={record.aiConfidence >= 0.9 ? '#10b981' : record.aiConfidence >= 0.8 ? '#f59e0b' : '#ef4444'}
          />
        </div>
      )
    },
    {
      title: '等待时间',
      dataIndex: 'waitingMinutes',
      width: 100,
      render: (minutes: number, record: ReviewTask) => {
        const isTimeout = minutes >= preferences.reviewReminderMinutes
        return (
          <div style={{ color: isTimeout ? '#f59e0b' : '#94a3b8', fontSize: 12 }}>
            {isTimeout && <ClockCircleOutlined style={{ marginRight: 4 }} />}
            {minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)}h${minutes % 60}m`}
          </div>
        )
      }
    },
    {
      title: '工作篮',
      dataIndex: 'workbasket',
      width: 100,
      render: (_: unknown, record: ReviewTask) => {
        const inBasket = workbasketTaskIds.has(record.id)
        if (record.status !== 'pending') {
          return <Tag color="default" style={{ fontSize: 11 }}>已处理</Tag>
        }
        return inBasket ? (
          <Tooltip title="已在工作篮">
            <Tag color="purple" style={{ fontSize: 11 }}>
              <FolderOpenOutlined /> 已加入
            </Tag>
          </Tooltip>
        ) : (
          <Tooltip title="未加入工作篮">
            <Tag color="default" style={{ fontSize: 11 }}>
              未加入
            </Tag>
          </Tooltip>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: ReviewTask) => {
        const inBasket = workbasketTaskIds.has(record.id)
        if (record.status !== 'pending') {
          return (
            <Tooltip title="查看历史">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setCurrentTask(record.id)
                  setActivePanel('history')
                }}
              >
                历史
              </Button>
            </Tooltip>
          )
        }
        return (
          <Space size={4}>
            <Tooltip title={inBasket ? '移出工作篮' : '加入工作篮'}>
              <Button
                type="text"
                size="small"
                icon={inBasket ? <MinusOutlined /> : <FolderOpenOutlined />}
                onClick={() =>
                  inBasket ? removeFromWorkbasket(record.id) : addToWorkbasket(record.id)
                }
                style={{ color: inBasket ? '#8b5cf6' : '#64748b' }}
              >
                {inBasket ? '移出' : '加入'}
              </Button>
            </Tooltip>
            <Tooltip title="查看详情">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setCurrentTask(record.id)
                  setActivePanel('compare')
                }}
              >
                查看
              </Button>
            </Tooltip>
          </Space>
        )
      }
    }
  ]

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <Card size="small" className="panel-card" style={{ border: 'none', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #334155', paddingBottom: 12, marginBottom: 16 }}>
          <Button
            type={activeTab === 'rules' ? 'primary' : 'default'}
            onClick={() => setActiveTab('rules')}
            style={{ background: activeTab === 'rules' ? '#0ea5e9' : 'transparent', borderColor: activeTab === 'rules' ? '#0ea5e9' : '#475569' }}
          >
            <ThunderboltOutlined /> 智能批量规则
          </Button>
          <Button
            type={activeTab === 'workbasket' ? 'primary' : 'default'}
            onClick={() => setActiveTab('workbasket')}
            style={{ background: activeTab === 'workbasket' ? '#8b5cf6' : 'transparent', borderColor: activeTab === 'workbasket' ? '#8b5cf6' : '#475569' }}
          >
            <FolderOpenOutlined /> 工作篮管理 ({workbasketTasks.length})
          </Button>
        </div>

        {activeTab === 'workbasket' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message={
                  <span>
                    工作篮中当前有 <strong style={{ color: '#8b5cf6' }}>{workbasketTasks.length}</strong> 份待审核报告，
                    处理时会按加入顺序自动前进
                  </span>
                }
                style={{ flex: 1, marginRight: 16 }}
              />
              <Space>
                {selectedTasks.length > 0 && (
                  <Button
                    size="small"
                    icon={<FolderOpenOutlined />}
                    onClick={() => {
                      const pendingToAdd = tasks.filter((t) => selectedTaskIds.has(t.id) && t.status === 'pending')
                      batchAddToWorkbasket(pendingToAdd.map((t) => t.id))
                      clearSelection()
                      message.success(`已将 ${pendingToAdd.length} 份报告加入工作篮`)
                    }}
                    style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
                    type="primary"
                  >
                    将选中加入工作篮
                  </Button>
                )}
                {workbasketTasks.length > 0 && (
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      modal.confirm({
                        title: '确认清空工作篮？',
                        content: `将移除工作篮中 ${workbasketTasks.length} 份报告`,
                        okText: '确认清空',
                        onOk: () => {
                          clearWorkbasket()
                          message.success('工作篮已清空')
                        }
                      })
                    }}
                  >
                    清空工作篮
                  </Button>
                )}
              </Space>
            </div>

            {workbasketTasks.length === 0 ? (
              <Empty
                description={
                  <span style={{ color: '#64748b' }}>
                    <FolderOpenOutlined style={{ marginRight: 4 }} />
                    工作篮为空，在左侧列表中选择报告加入
                  </span>
                }
                style={{ padding: 60 }}
              />
            ) : (
              <List
                size="small"
                dataSource={workbasketTasks}
                renderItem={(item, index) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      marginBottom: 8,
                      background: '#1e293b',
                      borderRadius: 4,
                      border: '1px solid #334155'
                    }}
                    actions={[
                      <Button
                        key="remove"
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => {
                          removeFromWorkbasket(item.id)
                          message.success(`已将 ${item.patientName} 移出工作篮`)
                        }}
                      >
                        移出
                      </Button>,
                      <Button
                        key="review"
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setCurrentTask(item.id)
                          setActivePanel('compare')
                        }}
                        style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}
                      >
                        开始审核
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#8b5cf6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: 14
                          }}
                        >
                          {index + 1}
                        </div>
                      }
                      title={
                        <span style={{ color: '#f1f5f9', fontSize: 13 }}>
                          {item.patientName} · {examTypeLabels[item.examType]}{item.examBodyPart}
                          {item.isEmergency && (
                            <Tag color="error" style={{ marginLeft: 8, fontSize: 10 }}>急诊</Tag>
                          )}
                        </span>
                      }
                      description={
                        <span style={{ color: '#64748b', fontSize: 12 }}>
                          {item.patientId} · {item.examNumber} · 置信度 {Math.round(item.aiConfidence * 100)}%
                          {item.previousExamDate && (
                            <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>有前片</Tag>
                          )}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        ) : (
          <div></div>
        )}
      </Card>

      {activeTab === 'rules' && (
        <>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>待审总数</span>}
              value={pendingTasks.length}
              prefix={<ClusterOutlined style={{ color: '#0ea5e9' }} />}
              valueStyle={{ color: '#0ea5e9', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>超时未审</span>}
              value={timeoutTasks.length}
              prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>已选中</span>}
              value={selectedTasks.length}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>高置信正常</span>}
              value={pendingTasks.filter((t) => t.aiConfidence >= 0.9 && !t.hasAbnormal).length}
              prefix={<ThunderboltOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      {timeoutTasks.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={
            <span>
              当前有 <strong style={{ color: '#f59e0b' }}>{timeoutTasks.length}</strong> 份报告等待超过
              {preferences.reviewReminderMinutes} 分钟，请尽快处理
            </span>
          }
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => {
                timeoutTasks.forEach((t) => {
                  if (!selectedTaskIds.has(t.id)) toggleTaskSelection(t.id)
                })
                message.success(`已选中 ${timeoutTasks.length} 份超时报告`)
              }}
            >
              一键选中
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        size="small"
        className="panel-card"
        style={{ border: 'none', marginBottom: 16 }}
        title={
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            <ThunderboltOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />
            智能批量规则
          </span>
        }
      >
        <Row gutter={12}>
          {batchRules.map((rule) => {
            const matchedCount = pendingTasks.filter(rule.filter).length
            return (
              <Col key={rule.id} span={6}>
                <div
                  onClick={() => matchedCount > 0 && handleSelectRule(rule)}
                  style={{
                    padding: 14,
                    borderRadius: 6,
                    background: matchedCount > 0 ? '#334155' : '#2a3344',
                    border: `1px solid ${rule.danger ? 'rgba(239,68,68,0.3)' : 'transparent'}`,
                    cursor: matchedCount > 0 ? 'pointer' : 'not-allowed',
                    opacity: matchedCount > 0 ? 1 : 0.5,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {rule.icon}
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9' }}>{rule.name}</span>
                    </div>
                    <Badge
                      count={matchedCount}
                      size="small"
                      style={{ backgroundColor: rule.danger ? '#ef4444' : '#0ea5e9' }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{rule.description}</div>
                </div>
              </Col>
            )
          })}
        </Row>
      </Card>

      <Card
        size="small"
        className="panel-card"
        style={{ border: 'none', marginBottom: 16 }}
        title={
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            <FilterOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />
            自定义筛选
          </span>
        }
      >
        <Row gutter={16} align="middle">
          <Col span={4}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>检查类型：</span>
            <Select
              value={batchType}
              onChange={setBatchType}
              size="small"
              style={{ width: 100, marginLeft: 8 }}
              options={[
                { value: 'all', label: '全部' },
                { value: 'CT', label: 'CT' },
                { value: 'MRI', label: 'MRI' },
                { value: 'DR', label: 'DR' },
                { value: 'US', label: '超声' }
              ]}
            />
          </Col>
          <Col span={6}>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>最小置信度：</span>
            <span style={{ color: '#0ea5e9', fontSize: 13, fontWeight: 600, marginLeft: 8 }}>{minConfidence}%</span>
            <Input
              type="range"
              min={50}
              max={99}
              value={minConfidence}
              onChange={(e) => setMinConfidence(Number(e.target.value))}
              style={{ width: 120, marginLeft: 8, height: 4 }}
            />
          </Col>
          <Col span={5}>
            <Checkbox checked={onlyNormal} onChange={(e) => setOnlyNormal(e.target.checked)}>
              <span style={{ fontSize: 12 }}>仅正常报告</span>
            </Checkbox>
          </Col>
          <Col span={5}>
            <Checkbox checked={onlyUrgent} onChange={(e) => setOnlyUrgent(e.target.checked)}>
              <span style={{ fontSize: 12 }}>仅加急/急诊</span>
            </Checkbox>
          </Col>
          <Col span={4} style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: '#64748b', marginRight: 8 }}>
              匹配 <strong style={{ color: '#0ea5e9' }}>{smartFiltered.length}</strong> 份
            </span>
            <Button size="small" type="primary" icon={<CheckSquareOutlined />} onClick={handleSelectSmartFiltered}>
              选中匹配
            </Button>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        className="panel-card"
        style={{ border: 'none', height: 'calc(100% - 480px)', minHeight: 300 }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              <ClusterOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />
              待审任务列表
            </span>
            <Space>
              <Button size="small" icon={<ClearOutlined />} onClick={clearSelection} disabled={selectedTasks.length === 0}>
                清空选择
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setShowRejectModal(true)}
                disabled={selectedTasks.length === 0}
              >
                批量驳回 ({selectedTasks.length})
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleBatchApprove}
                disabled={selectedTasks.length === 0}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                批量通过 ({selectedTasks.length})
              </Button>
            </Space>
          </div>
        }
      >
        {tasks.length > 0 ? (
          <Table
            dataSource={tasks}
            rowKey="id"
            columns={columns as any}
            size="small"
            pagination={{ pageSize: 8, showTotal: (total) => `共 ${total} 条` }}
            scroll={{ x: 900, y: 'calc(100vh - 620px)' }}
            rowSelection={{
              selectedRowKeys: Array.from(selectedTaskIds),
              onChange: (keys) => {
                clearSelection()
                keys.forEach((k) => toggleTaskSelection(String(k)))
              },
              getCheckboxProps: (record: ReviewTask) => ({
                disabled: record.status !== 'pending'
              })
            }}
            onRow={(record) => ({
              onDoubleClick: () => {
                setCurrentTask(record.id)
                setActivePanel('compare')
              }
            })}
            rowClassName={(record) =>
              record.waitingMinutes >= preferences.reviewReminderMinutes ? 'timeout-row' : ''
            }
          />
        ) : (
          <Empty description="暂无待审任务" style={{ padding: 40 }} />
        )}
      </Card>

      <Modal
        title={<span><CloseCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />批量驳回</span>}
        open={showRejectModal}
        onOk={handleConfirmReject}
        onCancel={() => setShowRejectModal(false)}
        okText="确认驳回"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={560}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>选择驳回原因模板：</div>
          <List
            size="small"
            dataSource={rejectTemplates.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                onClick={() => setRejectReason(item.content)}
                style={{
                  cursor: 'pointer',
                  padding: '8px 12px',
                  background: rejectReason === item.content ? 'rgba(239,68,68,0.1)' : '#334155',
                  borderRadius: 4,
                  marginBottom: 4,
                  border: rejectReason === item.content ? '1px solid #ef4444' : 'none'
                }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Tag color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>{item.category}</Tag>
                    <span style={{ fontSize: 10, color: '#64748b' }}>使用 {item.usageCount} 次</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#f1f5f9' }}>{item.content}</div>
                </div>
              </List.Item>
            )}
            style={{ background: 'transparent' }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>或自定义驳回原因：</div>
          <TextArea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            placeholder="请输入驳回原因..."
            style={{ fontSize: 12 }}
          />
        </div>
      </Modal>
        </>
      )}
    </div>
  )
}

export default BatchPanel
