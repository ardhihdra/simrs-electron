import type { ThemeConfig } from 'antd'

export interface DesktopSpacingScale {
  xxs: number
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
  xxl: number
}

export interface DesktopComponentSizeTokens {
  controlHeight: number
  controlHeightLg: number
  controlHeightSm: number
  cardPadding: number
  cardPaddingCompact: number
  menuItemHeight: number
  headerHeight: number
  rowHeight: number
}

export interface DesktopThemeTokens {
  colors: {
    accent: string
    accentHover: string
    accentSoft: string
    accentText: string
    accentDeep: string
    surface: string
    surfaceMuted: string
    surfaceRaised: string
    background: string
    border: string
    borderStrong: string
    text: string
    textMuted: string
    textSubtle: string
    dangerText: string
    scrim: string
    success: string
    warning: string
    danger: string
    info: string
  }
  typography: {
    fontFamilySans: string
    fontFamilyFallback: string
    fontFamilyMono: string
    baseFontSize: number
    labelFontSize: number
    captionFontSize: number
    titleFontSize: number
    heroFontSize: number
    lineHeight: number
  }
  radius: {
    sm: number
    md: number
    lg: number
    pill: number
  }
  shadow: {
    xs: string
    sm: string
    md: string
  }
  spacing: DesktopSpacingScale
  layout: {
    pagePadding: number
    sectionGap: number
    moduleBarHeight: number
    pageListWidth: number
    docTabHeight: number
    statusBarHeight: number
    shellMinHeight: number
    moduleBrandSize: number
    moduleNavHeight: number
    docTabButtonHeight: number
    docTabMaxWidth: number
    docTabOffsetY: number
    docTabGap: number
  }
  components: {
    button: DesktopComponentSizeTokens
    input: DesktopComponentSizeTokens
    card: DesktopComponentSizeTokens
    menu: DesktopComponentSizeTokens
    table: DesktopComponentSizeTokens
  }
}

export const desktopThemeTokens: DesktopThemeTokens = {
  colors: {
    accent: '#4f6ef7',
    accentHover: '#3f5ee7',
    accentSoft: '#e8edff',
    accentText: '#f8faff',
    accentDeep: '#3249b7',
    surface: '#ffffff',
    surfaceMuted: '#f4f6fb',
    surfaceRaised: '#eef2fb',
    background: '#edf1f8',
    border: '#d7deec',
    borderStrong: '#c1cce0',
    text: '#172033',
    textMuted: '#4e5d7a',
    textSubtle: '#7c89a2',
    dangerText: '#f8faff',
    scrim: 'rgba(237, 241, 248, 0.75)',
    success: '#248a67',
    warning: '#c88b22',
    danger: '#c25558',
    info: '#5476d9'
  },
  typography: {
    fontFamilySans: 'Inter',
    fontFamilyFallback: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontFamilyMono: "ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace",
    baseFontSize: 13,
    labelFontSize: 11,
    captionFontSize: 10,
    titleFontSize: 22,
    heroFontSize: 32,
    lineHeight: 1.45
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 10,
    pill: 999
  },
  shadow: {
    xs: '0 1px 1px rgba(15, 23, 42, 0.05)',
    sm: '0 1px 2px rgba(15, 23, 42, 0.08), 0 1px 1px rgba(15, 23, 42, 0.04)',
    md: '0 10px 30px -12px rgba(15, 23, 42, 0.22), 0 10px 18px -14px rgba(15, 23, 42, 0.16)'
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32
  },
  layout: {
    pagePadding: 24,
    sectionGap: 20,
    moduleBarHeight: 40,
    pageListWidth: 220,
    docTabHeight: 32,
    statusBarHeight: 22,
    shellMinHeight: 420,
    moduleBrandSize: 26,
    moduleNavHeight: 30,
    docTabButtonHeight: 28,
    docTabMaxWidth: 220,
    docTabOffsetY: 2,
    docTabGap: 1
  },
  components: {
    button: {
      controlHeight: 32,
      controlHeightLg: 36,
      controlHeightSm: 26,
      cardPadding: 12,
      cardPaddingCompact: 8,
      menuItemHeight: 32,
      headerHeight: 40,
      rowHeight: 40
    },
    input: {
      controlHeight: 36,
      controlHeightLg: 40,
      controlHeightSm: 28,
      cardPadding: 10,
      cardPaddingCompact: 8,
      menuItemHeight: 32,
      headerHeight: 40,
      rowHeight: 40
    },
    card: {
      controlHeight: 32,
      controlHeightLg: 40,
      controlHeightSm: 24,
      cardPadding: 16,
      cardPaddingCompact: 12,
      menuItemHeight: 32,
      headerHeight: 40,
      rowHeight: 40
    },
    menu: {
      controlHeight: 32,
      controlHeightLg: 40,
      controlHeightSm: 28,
      cardPadding: 12,
      cardPaddingCompact: 8,
      menuItemHeight: 34,
      headerHeight: 40,
      rowHeight: 40
    },
    table: {
      controlHeight: 32,
      controlHeightLg: 40,
      controlHeightSm: 24,
      cardPadding: 14,
      cardPaddingCompact: 10,
      menuItemHeight: 32,
      headerHeight: 40,
      rowHeight: 42
    }
  }
}

export const desktopAntdToken: ThemeConfig['token'] = {
  colorPrimary: desktopThemeTokens.colors.accent,
  colorPrimaryHover: desktopThemeTokens.colors.accentHover,
  colorPrimaryActive: desktopThemeTokens.colors.accentDeep,
  colorPrimaryBg: desktopThemeTokens.colors.accentSoft,
  colorPrimaryBgHover: '#d9e3ff',
  colorPrimaryBorder: '#b8c8ff',
  colorPrimaryBorderHover: '#97aeff',
  colorInfo: desktopThemeTokens.colors.info,
  colorSuccess: desktopThemeTokens.colors.success,
  colorWarning: desktopThemeTokens.colors.warning,
  colorError: desktopThemeTokens.colors.danger,
  colorBgBase: desktopThemeTokens.colors.surface,
  colorBgLayout: desktopThemeTokens.colors.background,
  colorBgContainer: desktopThemeTokens.colors.surface,
  colorBgElevated: desktopThemeTokens.colors.surface,
  colorBorder: desktopThemeTokens.colors.border,
  colorBorderSecondary: desktopThemeTokens.colors.borderStrong,
  colorTextBase: desktopThemeTokens.colors.text,
  colorText: desktopThemeTokens.colors.text,
  colorTextHeading: desktopThemeTokens.colors.text,
  colorTextSecondary: desktopThemeTokens.colors.textMuted,
  colorTextTertiary: desktopThemeTokens.colors.textSubtle,
  colorTextLabel: desktopThemeTokens.colors.textMuted,
  colorTextDescription: desktopThemeTokens.colors.textSubtle,
  colorFillAlter: desktopThemeTokens.colors.surfaceMuted,
  colorFillContent: '#e9eef8',
  colorFillContentHover: '#dfe7f8',
  colorSplit: '#dce4f0',
  borderRadius: desktopThemeTokens.radius.md,
  borderRadiusSM: desktopThemeTokens.radius.sm,
  borderRadiusLG: desktopThemeTokens.radius.lg,
  fontFamily: `${desktopThemeTokens.typography.fontFamilySans}, ${desktopThemeTokens.typography.fontFamilyFallback}`,
  fontFamilyCode: desktopThemeTokens.typography.fontFamilyMono,
  fontSize: desktopThemeTokens.typography.baseFontSize,
  fontSizeSM: 12,
  fontSizeLG: 14,
  fontSizeHeading1: desktopThemeTokens.typography.heroFontSize,
  fontSizeHeading2: 28,
  fontSizeHeading3: 24,
  fontSizeHeading4: 18,
  fontSizeHeading5: 15,
  controlHeight: desktopThemeTokens.components.input.controlHeight,
  controlHeightSM: desktopThemeTokens.components.input.controlHeightSm,
  controlHeightLG: desktopThemeTokens.components.input.controlHeightLg,
  padding: desktopThemeTokens.spacing.md,
  paddingSM: desktopThemeTokens.spacing.sm,
  paddingLG: desktopThemeTokens.spacing.xl,
  margin: desktopThemeTokens.spacing.md,
  marginSM: desktopThemeTokens.spacing.sm,
  marginLG: desktopThemeTokens.spacing.xl,
  size: desktopThemeTokens.spacing.md,
  sizeSM: desktopThemeTokens.spacing.sm,
  sizeLG: desktopThemeTokens.spacing.xl,
  lineHeight: desktopThemeTokens.typography.lineHeight,
  boxShadow: desktopThemeTokens.shadow.sm,
  boxShadowSecondary: desktopThemeTokens.shadow.md,
  boxShadowTertiary: desktopThemeTokens.shadow.xs,
  wireframe: false
}

export function buildDesktopCssVariables(tokens: DesktopThemeTokens): Record<string, string> {
  return {
    '--ds-font-sans': tokens.typography.fontFamilySans,
    '--ds-font-sans-fallback': tokens.typography.fontFamilyFallback,
    '--ds-font-mono': tokens.typography.fontFamilyMono,
    '--ds-font-size-body': `${tokens.typography.baseFontSize}px`,
    '--ds-font-size-label': `${tokens.typography.labelFontSize}px`,
    '--ds-font-size-caption': `${tokens.typography.captionFontSize}px`,
    '--ds-font-size-title': `${tokens.typography.titleFontSize}px`,
    '--ds-font-size-hero': `${tokens.typography.heroFontSize}px`,
    '--ds-line-height': String(tokens.typography.lineHeight),
    '--ds-color-accent': tokens.colors.accent,
    '--ds-color-accent-hover': tokens.colors.accentHover,
    '--ds-color-accent-soft': tokens.colors.accentSoft,
    '--ds-color-accent-text': tokens.colors.accentText,
    '--ds-color-accent-deep': tokens.colors.accentDeep,
    '--ds-color-surface': tokens.colors.surface,
    '--ds-color-surface-muted': tokens.colors.surfaceMuted,
    '--ds-color-surface-raised': tokens.colors.surfaceRaised,
    '--ds-color-background': tokens.colors.background,
    '--ds-color-border': tokens.colors.border,
    '--ds-color-border-strong': tokens.colors.borderStrong,
    '--ds-color-text': tokens.colors.text,
    '--ds-color-text-muted': tokens.colors.textMuted,
    '--ds-color-text-subtle': tokens.colors.textSubtle,
    '--ds-color-danger-text': tokens.colors.dangerText,
    '--ds-color-scrim': tokens.colors.scrim,
    '--ds-color-success': tokens.colors.success,
    '--ds-color-warning': tokens.colors.warning,
    '--ds-color-danger': tokens.colors.danger,
    '--ds-color-info': tokens.colors.info,
    '--ds-radius-sm': `${tokens.radius.sm}px`,
    '--ds-radius-md': `${tokens.radius.md}px`,
    '--ds-radius-lg': `${tokens.radius.lg}px`,
    '--ds-radius-pill': `${tokens.radius.pill}px`,
    '--ds-shadow-xs': tokens.shadow.xs,
    '--ds-shadow-sm': tokens.shadow.sm,
    '--ds-shadow-md': tokens.shadow.md,
    '--ds-space-xxs': `${tokens.spacing.xxs}px`,
    '--ds-space-xs': `${tokens.spacing.xs}px`,
    '--ds-space-sm': `${tokens.spacing.sm}px`,
    '--ds-space-md': `${tokens.spacing.md}px`,
    '--ds-space-lg': `${tokens.spacing.lg}px`,
    '--ds-space-xl': `${tokens.spacing.xl}px`,
    '--ds-space-xxl': `${tokens.spacing.xxl}px`,
    '--ds-layout-page-padding': `${tokens.layout.pagePadding}px`,
    '--ds-layout-section-gap': `${tokens.layout.sectionGap}px`,
    '--ds-layout-modulebar-h': `${tokens.layout.moduleBarHeight}px`,
    '--ds-layout-pagelist-w': `${tokens.layout.pageListWidth}px`,
    '--ds-layout-doc-tab-h': `${tokens.layout.docTabHeight}px`,
    '--ds-layout-statusbar-h': `${tokens.layout.statusBarHeight}px`,
    '--ds-layout-shell-min-h': `${tokens.layout.shellMinHeight}px`,
    '--ds-layout-module-brand-size': `${tokens.layout.moduleBrandSize}px`,
    '--ds-layout-module-nav-h': `${tokens.layout.moduleNavHeight}px`,
    '--ds-layout-doc-tab-button-h': `${tokens.layout.docTabButtonHeight}px`,
    '--ds-layout-doc-tab-max-w': `${tokens.layout.docTabMaxWidth}px`,
    '--ds-layout-doc-tab-offset-y': `${tokens.layout.docTabOffsetY}px`,
    '--ds-layout-doc-tab-gap': `${tokens.layout.docTabGap}px`,
    '--ds-button-h': `${tokens.components.button.controlHeight}px`,
    '--ds-button-h-lg': `${tokens.components.button.controlHeightLg}px`,
    '--ds-button-h-sm': `${tokens.components.button.controlHeightSm}px`,
    '--ds-input-h': `${tokens.components.input.controlHeight}px`,
    '--ds-input-h-lg': `${tokens.components.input.controlHeightLg}px`,
    '--ds-input-h-sm': `${tokens.components.input.controlHeightSm}px`,
    '--ds-card-padding': `${tokens.components.card.cardPadding}px`,
    '--ds-card-padding-compact': `${tokens.components.card.cardPaddingCompact}px`,
    '--ds-menu-item-h': `${tokens.components.menu.menuItemHeight}px`,
    '--ds-table-header-h': `${tokens.components.table.headerHeight}px`,
    '--ds-table-row-h': `${tokens.components.table.rowHeight}px`
  }
}
