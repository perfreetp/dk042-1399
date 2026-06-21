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
  FileTextOutlined,
  FolderOpenOutlined
} from '@ant-design/icons'
import { useReviewStore, useCurrentTask, useFilteredTasks } from '../store/reviewStore'
import type { ExamType, UrgencyLevel, ReviewTask, LesionMeasurement } from '../types'
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

function DICOMViewer({ mode, showAnnotation, task, zoom }: { mode: 'original' | 'ai' | 'split'; showAnnotation: boolean; task: ReviewTask | null; zoom: number }) {

  const getExamBackground = (examType: ExamType, bodyPart: string) => {
    if (examType === 'CT' && bodyPart.includes('胸部')) {
      return `
        radial-gradient(ellipse 60% 50% at 50% 45%, rgba(200,200,200,0.15) 0%, transparent 70%),
        radial-gradient(circle 30% at 30% 40%, rgba(255,255,255,0.08) 0%, transparent 100%),
        radial-gradient(circle 25% at 70% 55%, rgba(255,255,255,0.05) 0%, transparent 100%),
        linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)
      `
    } else if (examType === 'MRI' && bodyPart.includes('头颅')) {
      return `
        radial-gradient(ellipse 45% 55% at 50% 50%, rgba(180,180,200,0.2) 0%, transparent 70%),
        radial-gradient(ellipse 30% 40% at 50% 45%, rgba(200,200,220,0.15) 0%, transparent 100%),
        linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)
      `
    } else if (examType === 'DR') {
      return `
        radial-gradient(ellipse 55% 65% at 50% 40%, rgba(220,220,220,0.12) 0%, transparent 70%),
        linear-gradient(180deg, #222 0%, #111 50%, #222 100%)
      `
    } else if (examType === 'US') {
      return `
        radial-gradient(ellipse 60% 70% at 50% 40%, rgba(150,150,150,0.25) 0%, transparent 70%),
        repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px),
        linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)
      `
    } else if (examType === 'CT' && bodyPart.includes('腹部')) {
      return `
        radial-gradient(ellipse 55% 45% at 50% 55%, rgba(180,160,140,0.15) 0%, transparent 70%),
        radial-gradient(circle 20% at 35% 45%, rgba(200,180,160,0.1) 0%, transparent 100%),
        radial-gradient(circle 25% at 65% 55%, rgba(180,160,140,0.08) 0%, transparent 100%),
        linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)
      `
    }
    return `
      radial-gradient(ellipse 50% 50% at 50% 50%, rgba(200,200,200,0.12) 0%, transparent 70%),
      linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)
    `
  }

  const getAnatomyOverlay = (examType: ExamType, bodyPart: string) => {
    if (examType === 'CT' && bodyPart.includes('胸部')) {
      return (
        <>
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
          <line x1="200" y1="80" x2="200" y2="280" stroke="#444" strokeWidth="1" opacity="0.3" />
        </>
      )
    } else if (examType === 'MRI' && bodyPart.includes('头颅')) {
      return (
        <>
          <defs>
            <radialGradient id="brainGrad" cx="50%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#5a5a6a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3a3a4a" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="200" rx="110" ry="130" fill="url(#brainGrad)" />
          <ellipse cx="200" cy="200" rx="80" ry="95" fill="none" stroke="#555" strokeWidth="1" opacity="0.5" />
          <path d="M160 180 Q200 160 240 180" fill="none" stroke="#666" strokeWidth="1" opacity="0.4" />
        </>
      )
    } else if (examType === 'CT' && bodyPart.includes('腹部')) {
      return (
        <>
          <defs>
            <radialGradient id="abdomenGrad" cx="50%" cy="55%" r="40%">
              <stop offset="0%" stopColor="#4a4035" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#2a2520" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="220" rx="130" ry="120" fill="url(#abdomenGrad)" />
          <ellipse cx="140" cy="200" rx="40" ry="50" fill="none" stroke="#555" strokeWidth="1" opacity="0.4" />
          <ellipse cx="260" cy="220" rx="35" ry="45" fill="none" stroke="#555" strokeWidth="1" opacity="0.4" />
          <path d="M160 280 Q200 260 240 280" fill="none" stroke="#555" strokeWidth="1" opacity="0.4" />
        </>
      )
    } else if (examType === 'US') {
      return (
        <>
          <defs>
            <radialGradient id="usGrad" cx="50%" cy="40%" r="40%">
              <stop offset="0%" stopColor="#6a6a6a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3a3a3a" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="180" rx="150" ry="120" fill="url(#usGrad)" />
          {[...Array(20)].map((_, i) => (
            <line
              key={i}
              x1="50"
              y1={80 + i * 15}
              x2="350"
              y2={80 + i * 15}
              stroke="#333"
              strokeWidth="0.5"
              opacity="0.3"
            />
          ))}
        </>
      )
    } else if (examType === 'DR') {
      return (
        <>
          <defs>
            <radialGradient id="drGrad" cx="50%" cy="40%" r="40%">
              <stop offset="0%" stopColor="#5a5a5a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2a2a2a" stopOpacity="0.1" />
            </radialGradient>
          </defs>
          <ellipse cx="200" cy="200" rx="130" ry="160" fill="url(#drGrad)" />
          <line x1="200" y1="80" x2="200" y2="350" stroke="#666" strokeWidth="2" opacity="0.4" />
          <ellipse cx="200" cy="140" rx="100" ry="80" fill="none" stroke="#555" strokeWidth="1" opacity="0.5" />
        </>
      )
    }
    return <ellipse cx="200" cy="200" rx="120" ry="100" fill="rgba(100,100,100,0.2)" />
  }

  const getLesionColor = (type: string) => {
    if (type.includes('结节') || type.includes('肿块')) return '#f59e0b'
    if (type.includes('囊肿') || type.includes('良性')) return '#10b981'
    if (type.includes('梗塞') || type.includes('出血') || type.includes('恶性')) return '#ef4444'
    if (type.includes('钙化') || type.includes('结石')) return '#8b5cf6'
    return '#0ea5e9'
  }

  const lesionAnnotations = useMemo(() => {
    if (!task || !showAnnotation) return null

    return task.lesions.map((lesion, index) => {
      const positions = [
        { cx: 130, cy: 160 },
        { cx: 270, cy: 220 },
        { cx: 180, cy: 250 },
        { cx: 250, cy: 150 },
        { cx: 150, cy: 280 }
      ]
      const pos = positions[index % positions.length]
      const size = Math.min(30, Math.max(8, lesion.size * 2))
      const color = getLesionColor(lesion.type)

      const hasChange = lesion.changePercent !== undefined && lesion.changePercent !== 0
      const changeText = hasChange
        ? `${lesion.changePercent! > 0 ? '↑' : '↓'}${Math.abs(lesion.changePercent!)}%`
        : ''

      return (
        <g key={lesion.id}>
          <circle
            cx={pos.cx}
            cy={pos.cy}
            r={size}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={hasChange ? '4 2' : '0'}
          />
          {size > 12 && (
            <>
              <line
                x1={pos.cx - size}
                y1={pos.cy}
                x2={pos.cx + size}
                y2={pos.cy}
                stroke={color}
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1={pos.cx}
                y1={pos.cy - size}
                x2={pos.cx}
                y2={pos.cy + size}
                stroke={color}
                strokeWidth="1"
                opacity="0.5"
              />
            </>
          )}
          <rect
            x={pos.cx - size - 5}
            y={pos.cy - size - 22}
            width={size * 2 + 40}
            height={18}
            fill={`${color}33`}
            rx="2"
          />
          <text
            x={pos.cx}
            y={pos.cy - size - 9}
            fill={color}
            fontSize="10"
            textAnchor="middle"
            fontWeight="600"
          >
            {lesion.type} {lesion.size}mm {changeText}
          </text>
        </g>
      )
    })
  }, [task, showAnnotation])

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
          background: task ? getExamBackground(task.examType, task.examBodyPart) : '#111',
          borderRadius: 4
        }}
      >
        <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ position: 'absolute', inset: 0 }}>
          {task && getAnatomyOverlay(task.examType, task.examBodyPart)}
          {isAI && lesionAnnotations}
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 10 }}>
        <Tag color={isAI ? 'green' : 'blue'} style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
          {isAI ? 'AI标注' : '原始'}
        </Tag>
        {task && (
          <Tag color="default" style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>
            {examTypeLabels[task.examType]}
          </Tag>
        )}
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
        <span>{task?.examType === 'CT' ? 'W: 1500 L: -600' : task?.examType === 'MRI' ? 'W: 800 L: 100' : 'W: 2000 L: -500'}</span>
        <span>512 × 512</span>
        {task && <span>{task.examBodyPart}</span>}
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
    preferences,
    workbasketTaskIds
  } = useReviewStore()
  const currentTask = useCurrentTask()
  const filteredTasks = useFilteredTasks()
  const { message, modal } = AntdApp.useApp()

  const [viewMode, setViewMode] = useState<'original' | 'ai' | 'split'>(preferences.defaultView)
  const [showAnnotation, setShowAnnotation] = useState(true)
  const [selectedLesionId, setSelectedLesionId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const currentIndex = filteredTasks.findIndex((t) => t.id === currentTask?.id)
  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending')
  const pendingIndex = pendingTasks.findIndex((t) => t.id === currentTask?.id)

  const workbasketArray = Array.from(workbasketTaskIds)
  const workbasketTasks = tasks.filter((t) => workbasketTaskIds.has(t.id) && t.status === 'pending')
  const currentWorkbasketIndex = workbasketArray.indexOf(currentTask?.id || '')

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
                <Button size="small" icon={<ZoomInOutlined />} ghost onClick={() => setZoom((z) => Math.min(2, z + 0.2))} />
              </Tooltip>
              <Tooltip title="缩小">
                <Button size="small" icon={<ZoomOutOutlined />} ghost onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} />
              </Tooltip>
              <Tooltip title="重置视图">
                <Button size="small" icon={<SyncOutlined />} ghost onClick={() => setZoom(1)} />
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
            <DICOMViewer mode={viewMode} showAnnotation={showAnnotation} task={currentTask} zoom={zoom} />
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
                  const isSignificant = preferences.showChangeHighlight && lesion.isSignificant && lesion.changePercent
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
