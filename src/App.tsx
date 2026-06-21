import { useEffect } from 'react'
import { Layout, Menu, Avatar, Badge, Tooltip, App as AntdApp } from 'antd'
import {
  UnorderedListOutlined,
  PictureOutlined,
  FileTextOutlined,
  ClusterOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  ClockCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { useReviewStore } from './store/reviewStore'
import TaskListPanel from './components/TaskListPanel'
import ImageComparePanel from './components/ImageComparePanel'
import ConfirmPanel from './components/ConfirmPanel'
import BatchPanel from './components/BatchPanel'
import PreferencePanel from './components/PreferencePanel'
import HistoryPanel from './components/HistoryPanel'
import type { PanelKey } from './types'
import dayjs from 'dayjs'

const { Header, Sider, Content } = Layout

const menuItems: { key: PanelKey; icon: React.ReactNode; label: string }[] = [
  { key: 'list', icon: <UnorderedListOutlined />, label: '待审列表' },
  { key: 'compare', icon: <PictureOutlined />, label: '影像对照' },
  { key: 'confirm', icon: <FileTextOutlined />, label: '差异确认' },
  { key: 'batch', icon: <ClusterOutlined />, label: '批量处理' },
  { key: 'history', icon: <HistoryOutlined />, label: '审核记录' },
  { key: 'preference', icon: <UserOutlined />, label: '个人偏好' }
]

function App() {
  const { activePanel, setActivePanel, tasks, preferences } = useReviewStore()
  const { notification } = AntdApp.useApp()

  const timeoutCount = tasks.filter(
    (t) => t.status === 'pending' && t.waitingMinutes >= preferences.reviewReminderMinutes
  ).length

  useEffect(() => {
    const interval = setInterval(() => {
      const timeoutTasks = tasks.filter(
        (t) => t.status === 'pending' && t.waitingMinutes >= preferences.reviewReminderMinutes
      )
      if (timeoutTasks.length > 0) {
        notification.warning({
          message: `超时未审提醒`,
          description: `当前有 ${timeoutTasks.length} 份报告待审已超过 ${preferences.reviewReminderMinutes} 分钟`,
          duration: 5,
          placement: 'topRight'
        })
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [tasks, preferences.reviewReminderMinutes, notification])

  const pendingCount = tasks.filter((t) => t.status === 'pending').length

  const renderPanel = () => {
    switch (activePanel) {
      case 'list':
        return <TaskListPanel />
      case 'compare':
        return <ImageComparePanel />
      case 'confirm':
        return <ConfirmPanel />
      case 'batch':
        return <BatchPanel />
      case 'history':
        return <HistoryPanel />
      case 'preference':
        return <PreferencePanel />
      default:
        return <TaskListPanel />
    }
  }

  return (
    <Layout style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid #475569',
          height: 56
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff'
            }}
          >
            R
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>放射科回写审核工作站</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              AI 先出结果 · 人工审核 · 正式写入 PACS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Badge count={timeoutCount} size="small" offset={[-2, 2]} color="#f59e0b">
            <Tooltip title="超时未审提醒">
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#94a3b8',
                  fontSize: 13
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#334155'
                  e.currentTarget.style.color = '#f1f5f9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#94a3b8'
                }}
              >
                <ClockCircleOutlined />
                <span style={{ fontSize: 12 }}>{dayjs().format('MM-DD HH:mm')}</span>
              </div>
            </Tooltip>
          </Badge>

          <Tooltip title="系统通知">
            <BellOutlined
              style={{ fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            />
          </Tooltip>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid #475569' }}>
            <Avatar
              size={32}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              李
            </Avatar>
            <div>
              <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 500 }}>李明辉</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>副主任医师</div>
            </div>
          </div>

          <SettingOutlined
            style={{ fontSize: 16, color: '#64748b', cursor: 'pointer' }}
            onClick={() => setActivePanel('preference')}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
          />
        </div>
      </Header>

      <Layout>
        <Sider
          width={180}
          style={{
            borderRight: '1px solid #475569',
            overflow: 'auto'
          }}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[activePanel]}
            onClick={(e) => setActivePanel(e.key as PanelKey)}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: (
                <span style={{ fontSize: 13 }}>
                  {item.label}
                  {item.key === 'list' && pendingCount > 0 && (
                    <Badge
                      count={pendingCount}
                      size="small"
                      style={{ marginLeft: 8, backgroundColor: '#0ea5e9' }}
                    />
                  )}
                </span>
              )
            }))}
            style={{
              borderRight: 'none',
              background: 'transparent',
              paddingTop: 12
            }}
          />
        </Sider>

        <Content
          style={{
            background: '#0f172a',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {renderPanel()}
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
