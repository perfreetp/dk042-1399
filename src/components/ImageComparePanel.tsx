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
  Badge,
  Statistic,
  Progress,
  Alert,
  Empty,
  Radio,
  Switch,
  Dropdown,
  App as AntdApp
} from 'antd'
import {
  LeftOutlined,
  RightOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  DownOutlined,
  FullscreenOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useReviewStore, useCurrentTask, useFilteredTasks } from '../store/reviewStore'
import type { ExamType, UrgencyLevel } from '../types'
import dayjs from 'dayjs'

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

function DICOMViewer({ mode, showAnnotation }: { mode: 'original' | 'ai' | 'split'; showAnnotation: boolean }) {
  const [zoom, setZoom] = useState(1)

  const renderImage = (label: string, isAI: boolean) => (
    <div
      style={{
        flex: 1,
        position: 'relative',
        background: '#000',
        borderRadius: 4,
        overflow: 'hidden',
        minHeight: 200
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '3px 8px',
          background: 'rgba(0,0,0,0.6)',
          borderRadius: 3,
          fontSize: 11,
          color: isAI ? '#10b981' : '#0ea5e9',
          zIndex: 10
        }}
      >
        {label}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${zoom})`,
          width: '80%',
          height: '80%',
          background: `
            radial-gradient(ellipse 60% 50% at 50% 45%, rgba(200,200,200,0.15) 0%, transparent 70%),
            radial-gradient(circle 30% at 30% 40%, rgba(255,255,255,0.08) 0%, transparent 100%),
            radial-gradient(circle 25% at 70% 55%, rgba(255,255,255,0.05) 0%, transparent 100%),
            linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)
          `,
          borderRadius: 4
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <radialGradient id="tissueGrad" cx="50%" cy="45%" r="40%">
              <stop offset="0%" stopColor="#4a4a4a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2a2a2a" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="180" rx="140" ry="110" fill="url(#tissueGrad)" />
          <path
            d="M200 80 Q160 100 140 140 Q120 180 130 220 Q140 260 200 280 Q260 260 270 220 Q280 180 260 140 Q240 100 200 80"
            fill="none"
            stroke="#555"
            strokeWidth="1"
            opacity="0.5"
          />

          {isAI && showAnnotation && (
            <>
              <circle
                cx="130"
                cy="160"
                r="22"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              <line x1="130" y1="138" x2="130" y2="182" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />
              <line x1="108" y1="160" x2="152" y2="160" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />
              <rect x="105" y="130" width="70" height="18" fill="rgba(245,158,11,0.2)" rx="2" />
              <text x="140" y="143" fill="#f59e0b" fontSize="10" textAnchor="middle" fontWeight="600">
                结节 10.5mm ↑28%
              </text>

              <circle cx="270" cy="220" r="14" fill="none" stroke="#10b981" strokeWidth="2" />
              <rect x="248" y="198" width="56" height="18" fill="rgba(16,185,129,0.2)" rx="2" />
              <text x="276" y="211" fill="#10b981" fontSize="10" textAnchor="middle" fontWeight="600">
                条索 15mm
              </text>

              <circle cx="180" cy="250" r="10" fill="none" stroke="#64748b" strokeWidth="1.5" opacity="0.6" />
            </>
          )}
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10 }}>
        <Tag color={isAI ? 'green' : 'blue'} style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
          {isAI ? 'AI标注' : '原始'}
        </Tag>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#64748b',
          zIndex: 10
        }}
      >
        <span>W: 1500 L: -600</span>
        <span>512 × 512</span>
      </div>
    </div>
  )

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        gap: mode === 'split' ? 2 : 0,
        flexDirection: mode === 'split' ? 'row' : 'column'
      }}
    >
      {mode === 'original' && renderImage('原始影像', false)}
      {mode === 'ai' && renderImage('AI标注影像', true)}
      {mode === 'split' && (
        <>
          {renderImage('原始影像', false)}
          {renderImage('AI标注影像', true)}
        </>
      )}
    </div>
  )
}

function ImageComparePanel() {
  const {
    tasks,
    setCurrentTask,
    setActivePanel,
    approveTask,
    rejectTask,
    preferences
  } = useReviewStore()
  const currentTask = useCurrentTask()
  const filteredTasks = useFilteredTasks()
  const { message, modal } = AntdApp.useApp()

  const [viewMode, setViewMode] = useState<'original' | 'ai' | 'split'>('split')
  const [showAnnotation, setShowAnnotation] = useState(true)
  const [selectedLesionId, setSelectedLesionId] = useState<string | null>(null)

  const currentIndex = filteredTasks.findIndex((t) => t.id === currentTask?.id)
  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const pendingIndex = pendingTasks.findIndex((t) => t.id === currentTask?.id)

  const handlePrev = () => {
    if (pendingIndex > 0) {
      setCurrentTask(pendingTasks[pendingIndex - 1].id)
    }
  }

  const handleNext = () => {
    if (pendingIndex < pendingTasks.length - 1) {
      setCurrentTask(pendingTasks[pendingIndex + 1].id)
    }
  }

  const handleApprove = () => {
    if (!currentTask) return
    modal.confirm({
      title: '确认审核通过',
      content: (
        <div>
          <p>确认通过此报告并正式写入 PACS？</p>
          <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
            患者：{currentTask.patientName} | 检查号：{currentTask.accessionNumber}
          </p>
        </div>
      ),
      okText: '确认写入',
      cancelText: '取消',
      okButtonProps: { type: 'primary', danger: false },
      onOk: () => {
        approveTask(currentTask.id)
        message.success('报告已通过并写入 PACS')
        if (preferences.autoAdvance && pendingIndex < pendingTasks.length - 1) {
          setCurrentTask(pendingTasks[pendingIndex + 1].id)
        }
      }
    })
  }

  const handleReject = () => {
    if (!currentTask) return
    setActivePanel('confirm')
  }

  if (!currentTask) {
    return (
      <div style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Empty description="请从待审列表选择一份报告开始审核" />
      </div>
    )
  }

  const isTimeout = currentTask.status === 'pending' && currentTask.waitingMinutes >= preferences.reviewReminderMinutes

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
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => setActivePanel('list')}
            style={{ color: '#94a3b8' }}
          >
            返回列表
          </Button>

          <Divider type="vertical" style={{ height: 24, background: '#475569' }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{currentTask.patientName}</span>
              <Tag color={urgencyLabels[currentTask.urgency].color} style={{ margin: 0 }}>
                {urgencyLabels[currentTask.urgency].label}
              </Tag>
              <span style={{ color: '#64748b', fontSize: 12 }}>
                {currentTask.gender} · {currentTask.age}岁 · {currentTask.patientId}
              </span>
              {isTimeout && (
                <Badge color="#f59e0b" text={<span style={{ color: '#f59e0b', fontSize: 11 }}>超时未审</span>} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>
                {examTypeLabels[currentTask.examType]} · {currentTask.examBodyPart}
              </span>
              <span style={{ color: '#64748b', fontSize: 12, fontFamily: 'monospace' }}>
                {currentTask.accessionNumber}
              </span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{currentTask.studyDate}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button icon={<LeftOutlined />} onClick={handlePrev} disabled={pendingIndex <= 0} size="small">
            上一份
          </Button>
          <span style={{ color: '#64748b', fontSize: 12, minWidth: 60, textAlign: 'center' }}>
            {pendingIndex + 1} / {pendingTasks.length}
          </span>
          <Button icon={<RightOutlined />} onClick={handleNext} disabled={pendingIndex >= pendingTasks.length - 1} size="small">
            下一份
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#1e293b'
            }}
          >
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
              buttonStyle="solid"
            >
              <Radio.Button value="original">原始影像</Radio.Button>
              <Radio.Button value="ai">AI标注</Radio.Button>
              <Radio.Button value="split">并排对照</Radio.Button>
            </Radio.Group>

            <Space size="small">
              <Tooltip title={showAnnotation ? '隐藏AI标注' : '显示AI标注'}>
                <Button
                  type={showAnnotation ? 'primary' : 'default'}
                  size="small"
                  icon={showAnnotation ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  onClick={() => setShowAnnotation(!showAnnotation)}
                  ghost
                />
              </Tooltip>
              <Tooltip title="放大">
                <Button size="small" icon={<ZoomInOutlined />} ghost />
              </Tooltip>
              <Tooltip title="缩小">
                <Button size="small" icon={<ZoomOutOutlined />} ghost />
              </Tooltip>
              <Tooltip title="重置视图">
                <Button size="small" icon={<SyncOutlined />} ghost />
              </Tooltip>
              <Dropdown
                menu={{
                  items: [
                    { key: '1', label: '肺窗 W1500 L-600' },
                    { key: '2', label: '纵隔窗 W400 L40' },
                    { key: '3', label: '骨窗 W2000 L400' },
                    { key: '4', label: '软组织窗 W400 L50' }
                  ]
                }}
              >
                <Button size="small" icon={<FullscreenOutlined />} ghost>
                  窗宽窗位 <DownOutlined style={{ fontSize: 10 }} />
                </Button>
              </Dropdown>
            </Space>
          </div>

          <div style={{ flex: 1, padding: 16, background: '#0f172a', minHeight: 0 }}>
            <DICOMViewer mode={viewMode} showAnnotation={showAnnotation} />
          </div>
        </div>

        <div
          style={{
            width: 340,
            borderLeft: '1px solid #475569',
            background: '#1e293b',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9' }}>AI 分析概览</span>
              {preferences.showConfidence && (
                <Tooltip title={`AI整体置信度 ${Math.round(currentTask.aiConfidence * 100)}%`}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Progress
                      type="circle"
                      percent={Math.round(currentTask.aiConfidence * 100)}
                      size={28}
                      strokeWidth={6}
                      showInfo={false}
                      strokeColor={
                        currentTask.aiConfidence >= 0.9 ? '#10b981' : currentTask.aiConfidence >= 0.8 ? '#f59e0b' : '#ef4444'
                      }
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{Math.round(currentTask.aiConfidence * 100)}%</span>
                  </span>
                </Tooltip>
              )}
            </div>
            <Alert
              type={currentTask.hasAbnormal ? 'warning' : 'success'}
              showIcon
              icon={currentTask.hasAbnormal ? <InfoCircleOutlined /> : <CheckCircleOutlined />}
              message={
                <span style={{ fontSize: 12 }}>{currentTask.hasAbnormal ? '检测到异常征象' : '未见明确异常'}</span>
              }
              description={<span style={{ fontSize: 12, color: '#94a3b8' }}>{currentTask.aiSummary}</span>}
              style={{ background: 'transparent', border: 'none', padding: 0, margin: 0 }}
            />
          </div>

          <div style={{ padding: '14px 16px', borderBottom: '1px solid #475569', flex: 1, overflow: 'auto' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9', marginBottom: 12 }}>
              病灶测量与变化对比
              {preferences.showChangeHighlight && currentTask.previousExamDate && (
                <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>
                  对比: {currentTask.previousExamDate}
                </Tag>
              )}
            </div>

            {currentTask.lesions.length > 0 ? (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {currentTask.lesions.map((lesion) => {
                  const isSelected = selectedLesionId === lesion.id
                  const isSignificant = lesion.isSignificant && lesion.changePercent
                  return (
                    <div
                      key={lesion.id}
                      onClick={() => setSelectedLesionId(lesion.id)}
                      style={{
                        padding: 12,
                        borderRadius: 6,
                        background: isSelected ? 'rgba(14,165,233,0.1)' : '#334155',
                        border: isSelected ? '1px solid #0ea5e9' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#f1f5f9' }}>{lesion.name}</span>
                        {isSignificant && (
                          <Tag color={lesion.changePercent! > 0 ? 'orange' : 'green'} style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
                            {(lesion.changePercent! > 0 ? <CaretUpOutlined /> : <CaretDownOutlined />)}
                            {Math.abs(lesion.changePercent!)}%
                          </Tag>
                        )}
                      </div>

                      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{lesion.location}</div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {lesion.previousValue !== undefined ? (
                          <>
                            <div>
                              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>前次</div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: isSignificant ? '#94a3b8' : '#94a3b8',
                                  fontFamily: 'monospace',
                                  textDecoration: isSignificant ? 'line-through' : 'none'
                                }}
                              >
                                {lesion.previousValue}
                                <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{lesion.unit}</span>
                              </div>
                            </div>
                            <div style={{ color: '#64748b', fontSize: 14 }}>→</div>
                            <div>
                              <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>当前</div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 600,
                                  color: isSignificant ? (lesion.changePercent! > 0 ? '#f59e0b' : '#10b981') : '#f1f5f9',
                                  fontFamily: 'monospace',
                                  padding: isSignificant ? '2px 8px' : 0,
                                  borderRadius: 4,
                                  background: isSignificant ? (lesion.changePercent! > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)') : 'transparent'
                                }}
                              >
                                {lesion.currentValue}
                                <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{lesion.unit}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>
                            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>当前</div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>
                              {lesion.currentValue}
                              <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>{lesion.unit}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </Space>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                未检测到显著病灶
              </div>
            )}
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid #475569',
              background: '#334155'
            }}
          >
            <Row gutter={12}>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 10 }}>已等待</span>}
                  value={currentTask.waitingMinutes}
                  suffix="分钟"
                  valueStyle={{ fontSize: 16, fontWeight: 600, color: isTimeout ? '#f59e0b' : '#f1f5f9' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 10 }}>病灶数</span>}
                  value={currentTask.lesions.length}
                  valueStyle={{ fontSize: 16, fontWeight: 600, color: currentTask.lesions.length > 0 ? '#f59e0b' : '#10b981' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span style={{ color: '#64748b', fontSize: 10 }}>建议数</span>}
                  value={currentTask.suggestions.length}
                  valueStyle={{ fontSize: 16, fontWeight: 600, color: '#0ea5e9' }}
                />
              </Col>
            </Row>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid #475569',
              display: 'flex',
              gap: 10
            }}
          >
            <Button
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              style={{ flex: 1 }}
              disabled={currentTask.status !== 'pending'}
            >
              驳回
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => setActivePanel('confirm')}
              style={{ flex: 1 }}
            >
              差异确认
            </Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleApprove}
              style={{ flex: 1 }}
              disabled={currentTask.status !== 'pending'}
            >
              通过写入
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageComparePanel
