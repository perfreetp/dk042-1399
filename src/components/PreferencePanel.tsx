import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Switch,
  Button,
  Space,
  Divider,
  Tabs,
  Statistic,
  Progress,
  Input,
  Tag,
  List,
  Avatar,
  Alert,
  Form,
  InputNumber,
  Select,
  App as AntdApp,
  Tooltip,
  Typography
} from 'antd'
import {
  UserOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  PlusOutlined,
  CloseOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  EyeOutlined,
  SaveOutlined,
  RestOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useReviewStore } from '../store/reviewStore'
import type { ExamType } from '../types'
import dayjs from 'dayjs'

const { Text, Paragraph } = Typography
const { TextArea } = Input

const examTypeLabels: Record<ExamType, string> = {
  CT: 'CT',
  MRI: 'MRI',
  DR: 'DR',
  US: '超声',
  'PET-CT': 'PET-CT',
  DSA: 'DSA'
}

function StatsPanel() {
  const { stats } = useReviewStore()

  const weeklyOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#334155',
      borderColor: '#475569',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(14,165,233,0.1)' } }
    },
    legend: {
      data: ['审核数', '平均耗时(分钟)'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
      right: 0
    },
    grid: { left: 40, right: 40, top: 32, bottom: 24 },
    xAxis: {
      type: 'category',
      data: stats.weeklyData.map((d) => d.date),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '审核数',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
      },
      {
        type: 'value',
        name: '分钟',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '审核数',
        type: 'bar',
        data: stats.weeklyData.map((d) => d.count),
        barWidth: 18,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#0ea5e9' },
              { offset: 1, color: '#0369a1' }
            ]
          },
          borderRadius: [3, 3, 0, 0]
        }
      },
      {
        name: '平均耗时(分钟)',
        type: 'line',
        yAxisIndex: 1,
        data: stats.weeklyData.map((d) => d.avgTime),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#8b5cf6', width: 2 },
        itemStyle: { color: '#8b5cf6', borderColor: '#1e293b', borderWidth: 2 }
      }
    ]
  }

  const byTypeOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#334155',
      borderColor: '#475569',
      textStyle: { color: '#f1f5f9', fontSize: 12 },
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['审核数', '通过率'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      top: 0,
      right: 0
    },
    grid: { left: 50, right: 50, top: 32, bottom: 24 },
    xAxis: {
      type: 'category',
      data: stats.byExamType.map((d) => examTypeLabels[d.type]),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#64748b', fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '审核数',
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
      },
      {
        type: 'value',
        name: '通过率',
        min: 0,
        max: 1,
        nameTextStyle: { color: '#64748b', fontSize: 10 },
        axisLine: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (v: number) => `${Math.round(v * 100)}%`
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '审核数',
        type: 'bar',
        data: stats.byExamType.map((d) => d.count),
        barWidth: 22,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#047857' }
            ]
          },
          borderRadius: [3, 3, 0, 0]
        }
      },
      {
        name: '通过率',
        type: 'line',
        yAxisIndex: 1,
        data: stats.byExamType.map((d) => d.approvalRate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#f59e0b', width: 2 },
        itemStyle: { color: '#f59e0b', borderColor: '#1e293b', borderWidth: 2 }
      }
    ]
  }

  const approvalRate = stats.todayReviewed > 0 ? Math.round((stats.todayApproved / stats.todayReviewed) * 100) : 0

  return (
    <div style={{ padding: 4 }}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card className="panel-card" style={{ border: 'none' }} size="small">
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}><FileTextOutlined /> 今日已审核</span>}
              value={stats.todayReviewed}
              valueStyle={{ color: '#0ea5e9', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="panel-card" style={{ border: 'none' }} size="small">
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}><CheckCircleOutlined /> 通过</span>}
              value={stats.todayApproved}
              valueStyle={{ color: '#10b981', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="panel-card" style={{ border: 'none' }} size="small">
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}><CloseCircleOutlined /> 驳回</span>}
              value={stats.todayRejected}
              valueStyle={{ color: '#ef4444', fontSize: 32, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="panel-card" style={{ border: 'none' }} size="small">
            <Statistic
              title={<span style={{ color: '#94a3b8', fontSize: 12 }}><ClockCircleOutlined /> 平均耗时</span>}
              value={stats.avgReviewMinutes}
              suffix="分钟/份"
              valueStyle={{ color: '#8b5cf6', fontSize: 28, fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card
            className="panel-card"
            style={{ border: 'none' }}
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 500 }}><BarChartOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />近7日审核趋势</span>}
          >
            <ReactECharts option={weeklyOption} style={{ height: 260 }} notMerge />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            className="panel-card"
            style={{ border: 'none', height: '100%' }}
            size="small"
            title={<span style={{ fontSize: 13, fontWeight: 500 }}><RiseOutlined style={{ color: '#10b981', marginRight: 6 }} />今日通过率</span>}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Progress
                type="dashboard"
                percent={approvalRate}
                size={180}
                strokeWidth={14}
                showInfo={true}
                format={(p) => (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: approvalRate >= 80 ? '#10b981' : '#f59e0b' }}>{p}%</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>通过率</div>
                  </div>
                )}
                strokeColor={approvalRate >= 80 ? '#10b981' : '#f59e0b'}
                trailColor="#334155"
              />
              <Row gutter={24} style={{ marginTop: 20, width: '100%' }}>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>已通过</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#10b981' }}>{stats.todayApproved}</div>
                </Col>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>已驳回</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#ef4444' }}>{stats.todayRejected}</div>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        className="panel-card"
        style={{ border: 'none' }}
        size="small"
        title={<span style={{ fontSize: 13, fontWeight: 500 }}><EyeOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />按检查类型分布</span>}
      >
        <ReactECharts option={byTypeOption} style={{ height: 260 }} notMerge />
      </Card>
    </div>
  )
}

function SettingsPanel() {
  const { preferences, updatePreferences } = useReviewStore()
  const { message } = AntdApp.useApp()
  const [form] = Form.useForm()
  const [newRejectReason, setNewRejectReason] = useState('')

  const handleSave = () => {
    message.success('偏好设置已保存')
  }

  const handleAddRejectReason = () => {
    if (!newRejectReason.trim()) return
    if (preferences.commonRejectReasons.includes(newRejectReason.trim())) {
      message.warning('该原因已存在')
      return
    }
    updatePreferences({
      commonRejectReasons: [...preferences.commonRejectReasons, newRejectReason.trim()]
    })
    setNewRejectReason('')
    message.success('已添加常用驳回原因')
  }

  const handleRemoveRejectReason = (reason: string) => {
    updatePreferences({
      commonRejectReasons: preferences.commonRejectReasons.filter((r) => r !== reason)
    })
  }

  const handleReset = () => {
    form.resetFields()
    message.info('已重置为默认设置')
  }

  const shortcutLabels: Record<string, { label: string; desc: string }> = {
    approve: { label: '通过并写入', desc: '确认通过当前报告并写入PACS' },
    reject: { label: '驳回报告', desc: '驳回当前报告' },
    next: { label: '下一份', desc: '跳转到下一份待审报告' },
    previous: { label: '上一份', desc: '返回到上一份报告' },
    toggleAccept: { label: '切换采纳', desc: '切换当前AI建议的采纳状态' },
    zoomIn: { label: '放大影像', desc: '放大当前显示的影像' },
    zoomOut: { label: '缩小影像', desc: '缩小当前显示的影像' }
  }

  return (
    <div style={{ padding: 4 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          defaultView: preferences.defaultView,
          autoAdvance: preferences.autoAdvance,
          showChangeHighlight: preferences.showChangeHighlight,
          showConfidence: preferences.showConfidence,
          reviewReminderMinutes: preferences.reviewReminderMinutes
        }}
        onValuesChange={(changed, all) => {
          updatePreferences(changed)
        }}
      >
        <Row gutter={24}>
          <Col span={14}>
            <Card
              className="panel-card"
              style={{ border: 'none', marginBottom: 16 }}
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 500 }}><EyeOutlined style={{ color: '#0ea5e9', marginRight: 6 }} />显示偏好</span>}
            >
              <Form.Item label={<span style={{ fontSize: 12, color: '#94a3b8' }}>默认影像视图</span>} name="defaultView">
                <Select
                  size="small"
                  options={[
                    { value: 'split', label: '并排对照（原始 + AI标注）' },
                    { value: 'original', label: '仅原始影像' },
                    { value: 'ai', label: '仅AI标注影像' }
                  ]}
                />
              </Form.Item>

              <Form.Item label={<span style={{ fontSize: 12, color: '#94a3b8' }}>超时提醒阈值</span>} name="reviewReminderMinutes">
                <Select
                  size="small"
                  options={[
                    { value: 15, label: '15 分钟' },
                    { value: 30, label: '30 分钟' },
                    { value: 45, label: '45 分钟' },
                    { value: 60, label: '60 分钟' },
                    { value: 90, label: '90 分钟' }
                  ]}
                />
              </Form.Item>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#f1f5f9' }}>
                      <Form.Item name="showChangeHighlight" valuePropName="checked" noStyle>
                        <Switch size="small" />
                      </Form.Item>
                      <span style={{ marginLeft: 10 }}>显示病灶变化高亮</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginLeft: 32, marginTop: 2 }}>
                      与前次检查对比时，高亮显示显著变化的病灶
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#f1f5f9' }}>
                      <Form.Item name="showConfidence" valuePropName="checked" noStyle>
                        <Switch size="small" />
                      </Form.Item>
                      <span style={{ marginLeft: 10 }}>显示AI置信度</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginLeft: 32, marginTop: 2 }}>
                      在建议列表和影像对照中显示AI分析的置信度
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#f1f5f9' }}>
                      <Form.Item name="autoAdvance" valuePropName="checked" noStyle>
                        <Switch size="small" />
                      </Form.Item>
                      <span style={{ marginLeft: 10 }}>审核通过后自动进入下一份</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginLeft: 32, marginTop: 2 }}>
                      通过/驳回后自动跳转到下一份待审报告
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              className="panel-card"
              style={{ border: 'none' }}
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 500 }}><KeyOutlined style={{ color: '#8b5cf6', marginRight: 6 }} />键盘快捷键</span>}
            >
              <Alert
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
                message="快捷键可显著提升审核效率"
                style={{ marginBottom: 14, fontSize: 12, background: 'transparent', border: '1px dashed #475569' }}
              />
              <List
                size="small"
                dataSource={Object.entries(preferences.keyboardShortcuts)}
                renderItem={([key, value]) => (
                  <List.Item
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px solid #334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#f1f5f9' }}>{shortcutLabels[key]?.label || key}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{shortcutLabels[key]?.desc}</div>
                    </div>
                    <Tag
                      color="#334155"
                      style={{
                        fontSize: 11,
                        padding: '2px 10px',
                        fontFamily: 'monospace',
                        color: '#0ea5e9',
                        border: '1px solid #475569'
                      }}
                    >
                      {value}
                    </Tag>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col span={10}>
            <Card
              className="panel-card"
              style={{ border: 'none', marginBottom: 16 }}
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 500 }}><CloseCircleOutlined style={{ color: '#ef4444', marginRight: 6 }} />常用驳回原因</span>}
              extra={
                <Tooltip title="批量驳回时可快速选择这些原因">
                  <InfoCircleOutlined style={{ color: '#64748b' }} />
                </Tooltip>
              }
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <Input
                  size="small"
                  placeholder="输入新的驳回原因..."
                  value={newRejectReason}
                  onChange={(e) => setNewRejectReason(e.target.value)}
                  onPressEnter={handleAddRejectReason}
                  style={{ flex: 1 }}
                />
                <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleAddRejectReason}>
                  添加
                </Button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {preferences.commonRejectReasons.length > 0 ? (
                  preferences.commonRejectReasons.map((reason) => (
                    <div
                      key={reason}
                      style={{
                        padding: '8px 12px',
                        background: '#334155',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#f1f5f9' }}>{reason}</span>
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={() => handleRemoveRejectReason(reason)}
                        style={{ color: '#64748b' }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 12 }}>
                    暂无自定义常用驳回原因
                  </div>
                )}
              </div>
            </Card>

            <Card
              className="panel-card"
              style={{ border: 'none' }}
              size="small"
              title={<span style={{ fontSize: 13, fontWeight: 500 }}><UserOutlined style={{ color: '#10b981', marginRight: 6 }} />个人信息</span>}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <Avatar
                  size={56}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                    fontSize: 20,
                    fontWeight: 600
                  }}
                >
                  李
                </Avatar>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>李明辉</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>副主任医师 · 放射科</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>工号: DOC20230045</div>
                </div>
              </div>
              <Divider style={{ margin: '12px 0', borderColor: '#334155' }} />
              <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 2 }}>
                <div>所属科室：放射诊断科</div>
                <div>权限级别：审核医师</div>
                <div>上岗日期：2022-03-15</div>
                <div>上次登录：{dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm')}</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0 16px', borderColor: '#334155' }} />

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Button icon={<RestOutlined />} onClick={handleReset}>
            恢复默认
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            保存设置
          </Button>
        </div>
      </Form>
    </div>
  )
}

function PreferencePanel() {
  const [activeTab, setActiveTab] = useState('stats')

  return (
    <div style={{ padding: 20, height: '100%', overflow: 'auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
            <UserOutlined style={{ color: '#0ea5e9', marginRight: 8 }} />
            个人中心
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            查看审核效率统计，配置个性化偏好
          </div>
        </div>
      </div>

      <Card
        className="panel-card"
        style={{ border: 'none' }}
        bodyStyle={{ padding: 16 }}
        tabList={[
          {
            key: 'stats',
            tab: (
              <span>
                <BarChartOutlined style={{ marginRight: 6 }} />
                审核效率统计
              </span>
            )
          },
          {
            key: 'settings',
            tab: (
              <span>
                <SettingOutlined style={{ marginRight: 6 }} />
                偏好设置
              </span>
            )
          }
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'stats' ? <StatsPanel /> : <SettingsPanel />}
      </Card>
    </div>
  )
}

export default PreferencePanel
