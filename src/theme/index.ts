import type { ThemeConfig } from 'antd'

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#0ea5e9',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#0ea5e9',
    colorBgBase: '#0f172a',
    colorBgContainer: '#1e293b',
    colorBgElevated: '#334155',
    colorBgLayout: '#0f172a',
    colorBgSpotlight: '#475569',
    colorBorder: '#475569',
    colorBorderSecondary: '#334155',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
    colorTextQuaternary: '#475569',
    colorFillAlter: '#1e293b',
    colorFillContent: '#334155',
    borderRadius: 6,
    borderRadiusSM: 4,
    borderRadiusLG: 8,
    fontSize: 13,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24
  },
  components: {
    Layout: {
      bodyBg: '#0f172a',
      headerBg: '#1e293b',
      siderBg: '#1e293b',
      headerHeight: 56
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: '#334155',
      darkItemHoverBg: '#334155',
      darkItemColor: '#94a3b8',
      darkItemSelectedColor: '#f1f5f9',
      iconSize: 16,
      itemHeight: 42,
      itemBorderRadius: 4
    },
    Button: {
      controlHeight: 32,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    },
    Table: {
      headerBg: '#334155',
      headerColor: '#f1f5f9',
      borderColor: '#475569',
      rowHoverBg: '#334155',
      rowSelectedBg: 'rgba(14, 165, 233, 0.1)',
      rowSelectedHoverBg: 'rgba(14, 165, 233, 0.15)',
      cellPaddingBlock: 10,
      cellPaddingInline: 12
    },
    Card: {
      colorBgContainer: '#1e293b',
      colorBorderSecondary: '#475569',
      headerBg: '#334155'
    },
    Input: {
      colorBgContainer: '#334155',
      colorBorder: '#475569',
      activeBorderColor: '#0ea5e9',
      hoverBorderColor: '#64748b'
    },
    Select: {
      colorBgContainer: '#334155',
      colorBgElevated: '#334155',
      colorBorder: '#475569',
      optionSelectedBg: 'rgba(14, 165, 233, 0.15)'
    },
    Modal: {
      contentBg: '#1e293b',
      headerBg: '#334155'
    },
    Tag: {
      defaultBg: '#334155',
      defaultColor: '#94a3b8'
    },
    Progress: {
      colorInfo: '#0ea5e9'
    },
    Badge: {
      colorBgContainer: '#1e293b'
    },
    Tooltip: {
      colorBgSpotlight: '#475569',
      colorText: '#f1f5f9'
    },
    List: {
      headerBg: '#334155',
      itemPadding: '12px 16px'
    },
    Divider: {
      colorSplit: '#475569'
    },
    Radio: {
      buttonBg: '#334155',
      buttonCheckedBg: '#0ea5e9'
    },
    Switch: {
      colorPrimary: '#0ea5e9',
      colorPrimaryHover: '#38bdf8'
    },
    Slider: {
      trackBg: '#0ea5e9',
      railBg: '#475569'
    },
    Tabs: {
      itemColor: '#94a3b8',
      itemSelectedColor: '#0ea5e9',
      itemHoverColor: '#f1f5f9',
      inkBarColor: '#0ea5e9',
      titleFontSize: 14
    }
  }
}
