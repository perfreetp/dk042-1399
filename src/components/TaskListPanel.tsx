import { Card, Row, Col, Input, Select, Tag, Table, Button, Tooltip, Progress, Statistic, Empty, Space, Checkbox, App as AntdApp } from 'antd'
import {
  SearchOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CaretUpOutlined,
  EyeOutlined,
  PlusOutlined,
  MinusOutlined,
  FolderOpenOutlined
} from '@ant-design/icons'
import { useReviewStore, useFilteredTasks } from '../store/reviewStore'
import type { ReviewTask, ExamType, ReviewStatus, UrgencyLevel } from '../types'
import { useState } from 'react'
import dayjs from 'dayjs'

const { Search } = Input

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

const urgencyLabels: Record<UrgencyLevel, { label: string; color: string }> = {
  routine: { label: '常规', color: '#64748b' },
  urgent: { label: '加急', color: '#f59e0b' },
  emergency: { label: '急诊', color: '#ef4444' }
}

function TaskListPanel() {
  const {
    tasks,
    setCurrentTask,
    setActivePanel,
    filterType,
    setFilterType,
    filterUrgency,
    setFilterUrgency,
    filterStatus,
    setFilterStatus,
    searchText,
    setSearchText,
    preferences,
    workbasketTaskIds,
    addToWorkbasket,
    removeFromWorkbasket,
    batchAddToWorkbasket,
    clearSelection,
    selectedTaskIds,
    toggleTaskSelection,
    selectAllTasks
  } = useReviewStore()
  const filteredTasks = useFilteredTasks()
  const { message } = AntdApp.useApp()
  const [onlyWorkbasket, setOnlyWorkbasket] = useState(false)

  const displayTasks = onlyWorkbasket
    ? filteredTasks.filter((t) => workbasketTaskIds.has(t.id) && t.status === 'pending')
    : filteredTasks

  const visiblePendingIds = displayTasks.filter((t) => t.status === 'pending').map((t) => t.id)

  const summaryByType = (Object.keys(examTypeLabels) as ExamType[]).map((type) => ({
    type,
    total: tasks.filter((t) => t.examType === type).length,
    pending: tasks.filter((t) => t.examType === type && t.status === 'pending').length,
    timeout: tasks.filter(
      (t) => t.examType === type && t.status === 'pending' && t.waitingMinutes >= preferences.reviewReminderMinutes
    ).length
  }))

  const totalPending = tasks.filter((t) => t.status === 'pending').length
  const totalTimeout = tasks.filter(
    (t) => t.status === 'pending' && t.waitingMinutes >= preferences.reviewReminderMinutes
  ).length
  const totalEmergency = tasks.filter((t) => t.urgency === 'emergency' && t.status === 'pending').length

  const handleOpenReview = (task: ReviewTask) => {
    setCurrentTask(task.id)
    setActivePanel('compare')
  }

  const allVisiblePendingSelected =
    visiblePendingIds.length > 0 && visiblePendingIds.every((id) => selectedTaskIds.has(id))

  const columns = [
    {
      title: (
        <Checkbox
          checked={allVisiblePendingSelected}
          onChange={(e) => e.target.checked ? selectAllTasks(visiblePendingIds) : clearSelection()}
        />
      ),
      dataIndex: 'select',
      width: 45,
      fixed: 'left' as const,
      render: (_: unknown, record: ReviewTask) => (
        <Checkbox
          checked={selectedTaskIds.has(record.id)}
          onChange={() => toggleTaskSelection(record.id)}
          onClick={(e) => e.stopPropagation()}
          disabled={record.status !== 'pending'}
        />
      )
    },
    {
      title: '优先级',
      dataIndex: 'urgency',
      width: 70,
      fixed: 'left' as const,
      render: (urgency: UrgencyLevel) => {
        const cfg = urgencyLabels[urgency]
        return (
          <Tag color={cfg.color} style={{ margin: 0, fontSize: 11, padding: '1px 6px' }}>
            {cfg.label}
          </Tag>
        )
      }
    },
    {
      title: '患者信息',
      dataIndex: 'patientName',
      width: 160,
      render: (_: string, record: ReviewTask) => (
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 500, fontSize: 13 }}>
            {record.patientName}
            <span style={{ color: '#64748b', marginLeft: 6, fontSize: 12 }}>
              {record.gender} · {record.age}岁
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
            {record.patientId}
          </div>
        </div>
      )
    },
    {
      title: '检查类型',
      dataIndex: 'examType',
      width: 100,
      render: (type: ExamType, record: ReviewTask) => (
        <span style={{ color: '#94a3b8', fontSize: 12 }}>
          {examTypeLabels[type]} · {record.examBodyPart}
        </span>
      )
    },
    {
      title: '检查部位',
      dataIndex: 'examBodyPart',
      width: 90
    },
    {
      title: '检查号',
      dataIndex: 'accessionNumber',
      width: 130,
      render: (val: string) => <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>{val}</span>
    },
    {
      title: '检查时间',
      dataIndex: 'studyDate',
      width: 140,
      render: (val: string) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{val}</span>
    },
    {
      title: 'AI分析',
      dataIndex: 'aiSummary',
      width: 280,
      render: (_: string, record: ReviewTask) => (
        <div>
          <div
            style={{
              color: record.hasAbnormal ? '#f59e0b' : '#10b981',
              fontSize: 12,
              marginBottom: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {record.hasAbnormal ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
            {record.hasAbnormal ? '发现异常' : '未见异常'}
            <span style={{ color: '#64748b', marginLeft: 4 }}>
              置信度 {Math.round(record.aiConfidence * 100)}%
            </span>
          </div>
          <Progress
            percent={Math.round(record.aiConfidence * 100)}
            size="small"
            showInfo={false}
            strokeColor={record.aiConfidence >= 0.9 ? '#10b981' : record.aiConfidence >= 0.8 ? '#f59e0b' : '#ef4444'}
            style={{ width: 80 }}
          />
        </div>
      )
    },
    {
      title: '等待时间',
      dataIndex: 'waitingMinutes',
      width: 100,
      render: (minutes: number, record: ReviewTask) => {
        const isTimeout = record.status === 'pending' && minutes >= preferences.reviewReminderMinutes
        return (
          <div style={{ color: isTimeout ? '#f59e0b' : '#94a3b8', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isTimeout && <ClockCircleOutlined style={{ color: '#f59e0b' }} />}
              {minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)}小时${minutes % 60}分`}
            </div>
            {record.previousExamDate && (
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>
                前次: {record.previousExamDate}
              </div>
            )}
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status: ReviewStatus) => {
        const cfg = statusLabels[status]
        return (
          <Tag color={cfg.color} style={{ margin: 0, fontSize: 11 }}>
            {cfg.label}
          </Tag>
        )
      }
    },
    {
      title: '工作篮',
      key: 'workbasket',
      width: 80,
      render: (_: unknown, record: ReviewTask) => {
        const inBasket = workbasketTaskIds.has(record.id)
        return (
          <Tooltip title={inBasket ? '移出工作篮' : '加入工作篮'}>
            <Button
              type={inBasket ? 'primary' : 'default'}
              size="small"
              icon={inBasket ? <MinusOutlined /> : <PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                inBasket ? removeFromWorkbasket(record.id) : addToWorkbasket(record.id)
              }}
              disabled={record.status !== 'pending'}
              style={{
                background: inBasket ? '#8b5cf6' : 'transparent',
                borderColor: inBasket ? '#8b5cf6' : '#475569'
              }}
            >
              {inBasket ? '已加' : '加入'}
            </Button>
          </Tooltip>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: ReviewTask) => (
        <Tooltip title="开始审核">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenReview(record)}
            disabled={record.status !== 'pending'}
          >
            审核
          </Button>
        </Tooltip>
      )
    }
  ]

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>待审总数</span>}
              value={totalPending}
              prefix={<ClockCircleOutlined style={{ color: '#0ea5e9' }} />}
              valueStyle={{ color: '#0ea5e9', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>超时未审</span>}
              value={totalTimeout}
              prefix={<ExclamationCircleOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>急诊待审</span>}
              value={totalEmergency}
              prefix={<CloseCircleOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{ color: '#ef4444', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card
            size="small"
            className="panel-card"
            style={{ border: 'none', cursor: 'pointer' }}
            onClick={() => setOnlyWorkbasket(!onlyWorkbasket)}
          >
            <Statistic
              title={
                <span style={{ color: onlyWorkbasket ? '#0ea5e9' : '#94a3b8', fontSize: 12 }}>
                  <FolderOpenOutlined /> 审核工作篮
                </span>
              }
              value={workbasketTaskIds.size}
              valueStyle={{ color: onlyWorkbasket ? '#0ea5e9' : '#8b5cf6', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" className="panel-card" style={{ border: 'none' }}>
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}>异常发现</span>}
              value={tasks.filter((t) => t.hasAbnormal && t.status === 'pending').length}
              prefix={<CaretUpOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" className="panel-card" style={{ border: 'none', marginBottom: 16 }} title={<span style={{ fontSize: 13, fontWeight: 500 }}>按检查类型汇总</span>}>
        <Row gutter={12}>
          {summaryByType.filter((s) => s.total > 0).map((s) => (
            <Col key={s.type} span={4}>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 6,
                  background: '#334155',
                  cursor: 'pointer',
                  border: filterType === s.type ? '1px solid #0ea5e9' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
                onClick={() => setFilterType(filterType === s.type ? 'all' : s.type)}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{examTypeLabels[s.type]}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 20, fontWeight: 600, color: '#f1f5f9' }}>{s.pending}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>待审</span>
                  {s.timeout > 0 && (
                    <Tag color="#f59e0b" style={{ fontSize: 10, padding: '0 4px', marginLeft: 'auto' }}>
                      超时 {s.timeout}
                    </Tag>
                  )}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card size="small" className="panel-card" style={{ border: 'none', height: 'calc(100% - 260px)' }}>
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
              placeholder="搜索患者姓名/ID/检查号"
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              allowClear
              size="middle"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              size="middle"
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部类型' },
                ...Object.entries(examTypeLabels).map(([v, l]) => ({ value: v, label: l }))
              ]}
            />
            <Select
              value={filterUrgency}
              onChange={setFilterUrgency}
              size="middle"
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部优先级' },
                { value: 'emergency', label: '急诊' },
                { value: 'urgent', label: '加急' },
                { value: 'routine', label: '常规' }
              ]}
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              size="middle"
              style={{ width: 120 }}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'pending', label: '待审核' },
                { value: 'approved', label: '已通过' },
                { value: 'rejected', label: '已驳回' }
              ]}
            />
            <Checkbox
              checked={onlyWorkbasket}
              onChange={(e) => setOnlyWorkbasket(e.target.checked)}
            >
              <span style={{ fontSize: 12, color: onlyWorkbasket ? '#0ea5e9' : '#94a3b8' }}>
                <FolderOpenOutlined /> 仅看工作篮
              </span>
            </Checkbox>
            {selectedTaskIds.size > 0 && (
              <Button
                size="small"
                icon={<FolderOpenOutlined />}
                onClick={() => {
                  const idsToAdd = Array.from(selectedTaskIds).filter((id) =>
                    visiblePendingIds.includes(id)
                  )
                  batchAddToWorkbasket(idsToAdd)
                  clearSelection()
                  message.success(`已将 ${idsToAdd.length} 份报告加入工作篮`)
                }}
                style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}
                type="primary"
              >
                批量加入工作篮 ({selectedTaskIds.size})
              </Button>
            )}
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            共 {displayTasks.length} 条记录
            {onlyWorkbasket && <Tag color="#8b5cf6" style={{ marginLeft: 8 }}>工作篮模式</Tag>}
          </div>
        </div>

        {displayTasks.length > 0 ? (
          <Table
            dataSource={displayTasks}
            rowKey="id"
            columns={columns as any}
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`
            }}
            scroll={{ x: 1350, y: 'calc(100vh - 480px)' }}
            onRow={(record) => ({
              onDoubleClick: () => handleOpenReview(record),
              style: { cursor: 'pointer' }
            })}
            rowClassName={(record) =>
              record.status === 'pending' && record.waitingMinutes >= preferences.reviewReminderMinutes
                ? 'timeout-row'
                : ''
            }
          />
        ) : (
          <Empty description="暂无匹配的任务" style={{ padding: 40 }} />
        )}
      </Card>
    </div>
  )
}

export default TaskListPanel
