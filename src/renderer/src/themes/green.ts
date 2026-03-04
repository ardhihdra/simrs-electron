import type { ThemeConfig } from 'antd'

export const greenToken: ThemeConfig['token'] = {
    // ─── Seed: Brand ───────────────────────────────────────────────────────────
    colorPrimary: '#007a3d',
    colorInfo: '#00a59a',
    colorLink: '#007a3d',

    // ─── Seed: Semantic ────────────────────────────────────────────────────────
    colorSuccess: '#27a85f',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',

    // ─── Seed: Background & Text ───────────────────────────────────────────────
    colorBgBase: '#ffffff',
    colorTextBase: '#1a2e1e',

    // ─── Seed: Shape ───────────────────────────────────────────────────────────
    borderRadius: 6,

    // ─── Seed: Border ──────────────────────────────────────────────────────────
    lineType: 'solid',
    lineWidth: 1,

    // ─── Seed: Typography ──────────────────────────────────────────────────────
    fontSize: 14,
    fontFamily: 'Inter, sans-serif',
    fontFamilyCode: 'JetBrains Mono, monospace',

    // ─── Seed: Controls ────────────────────────────────────────────────────────
    controlHeight: 32,

    // ─── Seed: Size ────────────────────────────────────────────────────────────
    sizeUnit: 4,
    sizeStep: 4,
    sizePopupArrow: 16,

    // ─── Seed: Motion ──────────────────────────────────────────────────────────
    motion: true,
    motionBase: 0,
    motionUnit: 0.1,
    motionEaseInBack: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
    motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
    motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
    motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
    motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
    motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',

    // ─── Seed: Misc ────────────────────────────────────────────────────────────
    opacityImage: 1,
    wireframe: false,
    zIndexBase: 0,
    zIndexPopupBase: 1000,

    // ─── Map: Border Radius ────────────────────────────────────────────────────
    borderRadiusLG: 8,
    borderRadiusOuter: 4,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // ─── Map: Background ───────────────────────────────────────────────────────
    colorBgBlur: 'transparent',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0faf4',
    colorBgMask: 'rgba(0,0,0,0.45)',
    colorBgSolid: 'rgb(0,0,0)',
    colorBgSolidHover: 'rgba(0,0,0,0.75)',
    colorBgSolidActive: 'rgba(0,0,0,0.95)',
    colorBgSpotlight: 'rgba(0,0,0,0.85)',

    // ─── Map: Border ───────────────────────────────────────────────────────────
    colorBorder: '#d1e8d8',
    colorBorderSecondary: '#d1e8d8',

    // ─── Map: Text ─────────────────────────────────────────────────────────────
    colorText: '#1a2e1e',
    colorTextSecondary: '#2d5a3d',
    colorTextTertiary: '#5a7d6a',
    colorTextQuaternary: 'rgba(0,0,0,0.25)',

    // ─── Map: Primary Derivatives ──────────────────────────────────────────────
    colorPrimaryBg: '#e6f5ec',
    colorPrimaryBgHover: '#c3e6d0',
    colorPrimaryBorder: '#7ec89e',
    colorPrimaryBorderHover: '#4caa72',
    colorPrimaryHover: '#009149',
    colorPrimaryActive: '#005c2d',
    colorPrimaryText: '#007a3d',
    colorPrimaryTextHover: '#009149',
    colorPrimaryTextActive: '#005c2d',

    // ─── Map: Info Derivatives (Teal Kemenkes) ─────────────────────────────────
    colorInfoBg: '#e6f6f5',
    colorInfoBorder: '#7dd3d0',
    colorInfoText: '#007a74',

    // ─── Map: Success Derivatives ──────────────────────────────────────────────
    colorSuccessBg: '#f0faf4',
    colorSuccessBorder: '#95d9b0',
    colorSuccessHover: '#54c989',
    colorSuccessActive: '#1e8449',
    colorSuccessText: '#27a85f',

    // ─── Map: Warning Derivatives ──────────────────────────────────────────────
    colorWarningBg: '#fffbeb',
    colorWarningBorder: '#fcd34d',
    colorWarningHover: '#fbbf24',
    colorWarningActive: '#d97706',
    colorWarningText: '#f59e0b',

    // ─── Map: Error Derivatives ────────────────────────────────────────────────
    colorErrorBg: '#fff2f0',
    colorErrorBorder: '#ffccc7',
    colorErrorHover: '#ff7875',
    colorErrorActive: '#d9363e',
    colorErrorText: '#ff4d4f',

    // ─── Map: Control Heights ──────────────────────────────────────────────────
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,

    // ─── Map: Font Sizes ───────────────────────────────────────────────────────
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,

    // ─── Map: Line Heights ─────────────────────────────────────────────────────
    lineHeight: 1.5714285714285714,
    lineHeightLG: 1.5,
    lineHeightSM: 1.6666666666666667,

    // ─── Map: Motion Duration ──────────────────────────────────────────────────
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',

    // ─── Map: Sizes ────────────────────────────────────────────────────────────
    sizeXXS: 4,
    sizeXS: 8,
    sizeSM: 12,
    size: 16,
    sizeMS: 16,
    sizeMD: 20,
    sizeLG: 24,
    sizeXL: 32,
    sizeXXL: 48,

    // ─── Alias: Box Shadow ─────────────────────────────────────────────────────
    boxShadow:
        '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowSecondary:
        '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowTertiary:
        '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',

    // ─── Alias: Background ─────────────────────────────────────────────────────
    colorBgContainerDisabled: '#f0faf4',
    colorBgTextHover: 'rgba(0,122,61,0.06)',
    colorBgTextActive: 'rgba(0,122,61,0.15)',
    colorBorderBg: '#ffffff',
    colorErrorOutline: 'rgba(255,38,5,0.06)',
    colorWarningOutline: 'rgba(245,158,11,0.1)',

    // ─── Alias: Fill ───────────────────────────────────────────────────────────
    colorFillAlter: 'rgba(0,122,61,0.03)',
    colorFillContent: 'rgba(0,122,61,0.06)',
    colorFillContentHover: 'rgba(0,122,61,0.15)',

    // ─── Alias: Icons & Dividers ───────────────────────────────────────────────
    colorHighlight: '#ff4d4f',
    colorIcon: 'rgba(0,0,0,0.45)',
    colorIconHover: '#007a3d',
    colorSplit: 'rgba(0,122,61,0.08)',

    // ─── Alias: Text Variants ──────────────────────────────────────────────────
    colorTextHeading: '#1a2e1e',
    colorTextLabel: '#2d5a3d',
    colorTextDescription: '#5a7d6a',
    colorTextDisabled: '#9cbfaa',
    colorTextPlaceholder: '#9cbfaa',
    colorTextLightSolid: '#ffffff',

    // ─── Alias: Control Item ───────────────────────────────────────────────────
    controlInteractiveSize: 16,
    controlItemBgHover: 'rgba(0,122,61,0.04)',
    controlItemBgActive: '#e6f5ec',
    controlItemBgActiveHover: '#c3e6d0',
    controlItemBgActiveDisabled: 'rgba(0,0,0,0.15)',
    controlOutline: 'rgba(0,122,61,0.12)',
    controlOutlineWidth: 2,

    // ─── Alias: Typography ─────────────────────────────────────────────────────
    fontSizeIcon: 12,
    fontWeightStrong: 600,

    // ─── Alias: Focus & Link ───────────────────────────────────────────────────
    lineWidthFocus: 3,
    linkDecoration: 'none',
    linkHoverDecoration: 'none',
    linkFocusDecoration: 'none',

    // ─── Alias: Margin ─────────────────────────────────────────────────────────
    marginXXS: 4,
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,

    // ─── Alias: Padding ────────────────────────────────────────────────────────
    paddingXXS: 4,
    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,

    // ─── Alias: Misc ───────────────────────────────────────────────────────────
    opacityLoading: 0.65,

    // ─── Alias: Breakpoints ────────────────────────────────────────────────────
    screenXS: 480,
    screenSM: 576,
    screenMD: 768,
    screenLG: 992,
    screenXL: 1200,
    screenXXL: 1600
}
