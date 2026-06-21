import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Tag,
  Table,
  Button,
  Tooltip,
  Empty,
  Space,
  Divider,
  Alert,
  List,
  Avatar,
  Statistic,
  Typography
} from 'antd'
import {
  SearchOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  EditOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useReviewStore, useHistoryTasks, useCurrentTask } from '../store/reviewStore'
import type { ReviewTask, ExamType, ReviewStatus, AISuggestion } from '../types'
import { useState } from 'react'

const { Search } = Input
const { Paragraph, Text } = Typography

const examTypeLabels: Record<ExamType, string> = {
  CT: 'CT',
  MRI: 'MRI',
  DR: 'DR',
  US: '超声',
  'PET-CT': 'PET-CT',
  DSA: 'DSA'
}

const statusLabels: Record<ReviewStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: '#0ea5e9' },
  reviewing: { label: '审核中', color: '#8b5cf6' },
  approved: { label: '已通过', color: '#10b981' },
  rejected: { label: '已驳回', color: '#ef4444' },
  timeout: { label: '已超时', color: '#f59e0b' }
}

const suggestionTypeLabels: Record<AISuggestion['type'], { label: string; color: string }> = {
  finding: { label: '影像所见', color: '#0ea5e9' },
  impression: { label: '诊断意见', color: '#8b5cf6' },
  recommendation: { label: '处理建议', color: '#10b981' }
}

function HistoryDetailView({ task, onBack }: { task: ReviewTask; onBack: () => void }) {
  const accepted = task.suggestions.filter((s) => s.accepted === true)
  const rejected = task.suggestions.filter((s) => s.accepted === false)
  const pending = task.suggestions.filter((s) => s.accepted === null)

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <Card
        size="small"
        className="panel-card"
        style={{ border: 'none', marginBottom: 16 }}
        title={
          <Space>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ color: '#94a3b8', padding: 0 }}>
              返回列表
            </Button>
            <Divider type="vertical" style={{ height: 20, background: '#475569', margin: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>
              {task.patientName} · {examTypeLabels[task.examType]}{task.examBodyPart}
            </span>
            <Tag color={statusLabels[task.status].color}>{statusLabels[task.status].label}</Tag>
            {task.pacsWriteStatus === 'failed' && (
              <Tag color="error">
                <WarningOutlined /> 写入失败
              </Tag>
            )}
            {task.pacsWriteStatus === 'success' && (
              <Tag color="success">
                <CheckCircleOutlined /> PACS写入成功
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            <Text style={{ color: '#64748b', fontSize: 12 }}>检查号: {task.accessionNumber}</Text>
            {task.reviewedAt && <Text style={{ color: '#64748b', fontSize: 12 }}>审核时间: {task.reviewedAt}</Text>}
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <div style={{ padding: 12, background: '#1e293b', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>患者ID</div>
              <div style={{ fontSize: 13, color: '#f1f5f9', fontFamily: 'monospace' }}>{task.patientId}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ padding: 12, background: '#1e293b', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>性别年龄</div>
              <div style={{ fontSize: 13, color: '#f1f5f9' }}>{task.gender} · {task.age}岁</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ padding: 12, background: '#1e293b', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>检查时间</div>
              <div style={{ fontSize: 13, color: '#f1f5f9' }}>{task.studyDate}</div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ padding: 12, background: '#1e293b', borderRadius: 6 }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>AI置信度</div>
              <div style={{ fontSize: 13, color: '#f1f5f9' }}>{Math.round(task.aiConfidence * 100)}%</div>
            </div>
          </Col>
        </Row>

        {task.rejectReason && (
          <Alert
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
            message="驳回原因"
            description={task.rejectReason}
            style={{ marginBottom: 16 }}
          />
        )}

        {task.finalReport && (
          <Card
            size="small"
            title={
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                <FileTextOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />
                最终报告内容
              </span>
            }
            style={{ marginBottom: 16, background: '#1e293b', border: 'none' }}
          >
            <div style={{ marginBottom: 12 }}>
              <Tag color="blue" style={{ marginBottom: 8 }}>影像所见</Tag>
              <Paragraph
                style={{
                  padding: 12,
                  background: '#0f172a',
                  borderRadius: 4,
                  fontSize: 13,
                  color: '#f1f5f9',
                  marginBottom: 0,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {task.finalReport.findings}
              </Paragraph>
            </div>
            <div>
              <Tag color="purple" style={{ marginBottom: 8 }}>诊断意见</Tag>
              <Paragraph
                style={{
                  padding: 12,
                  background: '#0f172a',
                  borderRadius: 4,
                  fontSize: 13,
                  color: '#f1f5f9',
                  marginBottom: 0,
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {task.finalReport.impression}
              </Paragraph>
            </div>
          </Card>
        )}
      </Card>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            size="small"
            className="panel-card"
            style={{ border: 'none', height: '100%' }}
            title={
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />
                采纳的建议 ({accepted.length})
              </span>
            }
          >
            {accepted.length > 0 ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {accepted.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: 12,
                      background: '#1e293b',
                      borderRadius: 4,
                      borderLeft: '3px solid #10b981'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Tag color={suggestionTypeLabels[s.type].color} style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                        {suggestionTypeLabels[s.type].label}
                      </Tag>
                      {s.isModified && (
                        <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0 }}>
                          <EditOutlined style={{ fontSize: 10 }} /> 人工修改
                        </Tag>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#f1f5f9', lineHeight: 1.7 }}>
                      {s.modifiedContent || s.content}
                    </div>
                    {s.isModified && (
                      <div style={{ marginTop: 8, padding: 8, background: '#0f172a', borderRadius: 4 }}>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>AI原始内容：</div>
                        <div style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>{s.content}</div>
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="无采纳内容" style={{ padding: 20 }} />
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card
            size="small"
            className="panel-card"
            style={{ border: 'none', marginBottom: 16 }}
            title={
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                <CloseCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />
                拒绝的建议 ({rejected.length})
              </span>
            }
          >
            {rejected.length > 0 ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {rejected.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: 12,
                      background: '#1e293b',
                      borderRadius: 4,
                      borderLeft: '3px solid #ef4444',
                      opacity: 0.7
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Tag color={suggestionTypeLabels[s.type].color} style={{ fontSize: 10, padding: '0 4px', margin: 0, opacity: 0.5 }}>
                        {suggestionTypeLabels[s.type].label}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, textDecoration: 'line-through' }}>
                      {s.modifiedContent || s.content}
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="无拒绝内容" style={{ padding: 20 }} />
            )}
          </Card>

          <Card
            size="small"
            className="panel-card"
            style={{ border: 'none' }}
            title={
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                <EditOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />
                人工修改记录 ({task.modifications.length})
              </span>
            }
          >
            {task.modifications.length > 0 ? (
              <List
                size="small"
                dataSource={task.modifications}
                renderItem={(item) => (
                  <List.Item style={{ background: '#1e293b', marginBottom: 8, borderRadius: 4, padding: '10px 12px' }}>
                    <List.Item.Meta
                      avatar={<Avatar size="small" style={{ background: '#8b5cf6', fontSize: 11 }}>修</Avatar>}
                      title={
                        <span style={{ fontSize: 12, color: '#f1f5f9' }}>
                          修改了「{suggestionTypeLabels[item.suggestionType].label}」
                        </span>
                      }
                      description={
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                          <div style={{ textDecoration: 'line-through', marginBottom: 3 }}>原文：{item.originalValue}</div>
                          <div style={{ color: '#10b981' }}>修改：{item.modifiedValue}</div>
                          <div style={{ marginTop: 4, fontSize: 10 }}>{item.modifiedAt} · {item.operator}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="无修改记录" style={{ padding: 20 }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

function HistoryPanel() {
  const {
    tasks,
    historyFilter,
    setHistoryFilter,
    setCurrentTask,
    setActivePanel
  } = useReviewStore()
  const historyTasks = useHistoryTasks()
  const currentTask = useCurrentTask()
  const [viewingTask, setViewingTask] = useState<ReviewTask | null>(null)

  const totalApproved = tasks.filter((t) => t.status === 'approved').length
  const totalRejected = tasks.filter((t) => t.status === 'rejected').length
  const totalWriteFailed = tasks.filter((t) => t.pacsWriteStatus === 'failed').length

  if (viewingTask) {
    return <HistoryDetailView task={viewingTask} onBack={() => setViewingTask(null)} />
  }

  const columns = [
    {
      title: '患者',
      dataIndex: 'patientName',
      width: 140,
      render: (_: string, record: ReviewTask) => (
        <div>
          <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>{record.patientName}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {record.gender} · {record.age}岁 · {record.patientId}
          </div>
        </div>
      )
    },
    {
      title: '检查',
      dataIndex: 'examType',
      width: 120,
      render: (type: ExamType, record: ReviewTask) => (
        <span style={{ fontSize: 12, color: '#94a3b8' }}>
          {examTypeLabels[type]} · {record.examBodyPart}
        </span>
      )
    },
    {
      title: '检查号',
      dataIndex: 'accessionNumber',
      width: 140,
      render: (val: string) => <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#94a3b8' }}>{val}</span>
    },
    {
      title: '检查时间',
      dataIndex: 'studyDate',
      width: 140,
      render: (val: string) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{val}</span>
    },
    {
      title: '审核结果',
      dataIndex: 'status',
      width: 100,
      render: (status: ReviewStatus, record: ReviewTask) => {
        const cfg = statusLabels[status]
        return (
          <Space direction="vertical" size={4}>
            <Tag color={cfg.color} style={{ margin: 0, fontSize: 11 }}>
              {cfg.label}
            </Tag>
            {record.pacsWriteStatus === 'failed' && (
              <Tag color="error" style={{ margin: 0, fontSize: 10 }}>
                <WarningOutlined /> 写入失败
              </Tag>
            )}
            {record.pacsWriteStatus === 'success' && (
              <Tag color="success" style={{ margin: 0, fontSize: 10 }}>
                <CheckCircleOutlined /> PACS OK
              </Tag>
            )}
          </Space>
        )
      }
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      width: 150,
      render: (val?: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{val || '-'}</span>
    },
    {
      title: 'AI结果',
      dataIndex: 'aiConfidence',
      width: 100,
      render: (_: number, record: ReviewTask) => (
        <div style={{ fontSize: 12, color: record.hasAbnormal ? '#f59e0b' : '#10b981' }}>
          {record.hasAbnormal ? '异常' : '正常'} · {Math.round(record.aiConfidence * 100)}%
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: ReviewTask) => (
        <Space>
          <Tooltip title="查看审核详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setViewingTask(record)}
            >
              查看
            </Button>
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="继续审核">
              <Button
                type="link"
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setCurrentTask(record.id)
                  setActivePanel('compare')
                }}
              >
                继续
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>已通过</span>}
              value={totalApproved}
              prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981', fontSize: 26, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>已驳回</span>}
              value={totalRejected}
              prefix={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{ color: '#ef4444', fontSize: 26, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>写入失败</span>}
              value={totalWriteFailed}
              prefix={<WarningOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b', fontSize: 26, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>历史记录总数</span>}
              value={tasks.filter((t) => t.status !== 'pending').length}
              prefix={<HistoryOutlined style={{ color: '#0ea5e9' }} />}
              valueStyle={{ color: '#0ea5e9', fontSize: 26, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" className="panel-card" style={{ border: 'none', height: 'calc(100% - 140px)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Search
              placeholder="搜索患者姓名"
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              allowClear
              size="middle"
              value={historyFilter.patientName || ''}
              onChange={(e) => setHistoryFilter({ patientName: e.target.value })}
              style={{ width: 200 }}
            />
            <Search
              placeholder="搜索检查号"
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              allowClear
              size="middle"
              value={historyFilter.accessionNumber || ''}
              onChange={(e) => setHistoryFilter({ accessionNumber: e.target.value })}
              style={{ width: 200 }}
            />
            <Select
              value={historyFilter.status || 'all'}
              onChange={(v) => setHistoryFilter({ status: v })}
              size="middle"
              style={{ width: 140 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已驳回' },
                { value: 'timeout', label: '已超时' }
              ]}
            />
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            共 {historyTasks.length} 条记录
          </div>
        </div>

        {historyTasks.length > 0 ? (
          <Table
            dataSource={historyTasks}
            rowKey="id"
            columns={columns as any}
            size="small"
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
            scroll={{ x: 1000, y: 'calc(100vh - 320px)' }}
          />
        ) : (
          <Empty
            description={
              <span style={{ color: '#64748b' }}>
                <HistoryOutlined style={{ marginRight: 4 }} />
                暂无审核历史记录
              </span>
            }
            style={{ padding: 60 }}
          />
        )}
      </Card>
    </div>
  )
}

export default HistoryPanel
