import type { ThemeConfig } from 'antd'

export const retroToken: ThemeConfig['token'] = {
    // ─── Seed: Brand ───────────────────────────────────────────────────────────
    colorPrimary: '#b45309',
    colorInfo: '#92400e',
    colorLink: '#b45309',

    // ─── Seed: Semantic ────────────────────────────────────────────────────────
    colorSuccess: '#15803d',
    colorWarning: '#d97706',
    colorError: '#dc2626',

    // ─── Seed: Background & Text ───────────────────────────────────────────────
    colorBgBase: '#fdf6e3',
    colorTextBase: '#3b2a1a',

    // ─── Seed: Shape ───────────────────────────────────────────────────────────
    borderRadius: 4,

    // ─── Seed: Border ──────────────────────────────────────────────────────────
    lineType: 'solid',
    lineWidth: 1,

    // ─── Seed: Typography ──────────────────────────────────────────────────────
    fontSize: 14,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontFamilyCode: 'Courier New, Courier, monospace',

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
    borderRadiusLG: 6,
    borderRadiusOuter: 2,
    borderRadiusSM: 2,
    borderRadiusXS: 2,

    // ─── Map: Background ───────────────────────────────────────────────────────
    colorBgBlur: 'transparent',
    colorBgContainer: '#fdf6e3',
    colorBgElevated: '#fef9ee',
    colorBgLayout: '#f5ead7',
    colorBgMask: 'rgba(59,42,26,0.5)',
    colorBgSolid: 'rgb(59,42,26)',
    colorBgSolidHover: 'rgba(59,42,26,0.75)',
    colorBgSolidActive: 'rgba(59,42,26,0.95)',
    colorBgSpotlight: 'rgba(59,42,26,0.85)',

    // ─── Map: Border ───────────────────────────────────────────────────────────
    colorBorder: '#c8a97e',
    colorBorderSecondary: '#ddc9aa',

    // ─── Map: Text ─────────────────────────────────────────────────────────────
    colorText: '#3b2a1a',
    colorTextSecondary: '#6b4c2a',
    colorTextTertiary: '#9a7351',
    colorTextQuaternary: 'rgba(59,42,26,0.25)',

    // ─── Map: Primary Derivatives ──────────────────────────────────────────────
    colorPrimaryBg: '#fef3c7',
    colorPrimaryBgHover: '#fde68a',
    colorPrimaryBorder: '#f59e0b',
    colorPrimaryBorderHover: '#d97706',
    colorPrimaryHover: '#d97706',
    colorPrimaryActive: '#92400e',
    colorPrimaryText: '#b45309',
    colorPrimaryTextHover: '#d97706',
    colorPrimaryTextActive: '#92400e',

    // ─── Map: Success Derivatives ──────────────────────────────────────────────
    colorSuccessBg: '#f0fdf4',
    colorSuccessBorder: '#86efac',
    colorSuccessHover: '#4ade80',
    colorSuccessActive: '#15803d',
    colorSuccessText: '#15803d',

    // ─── Map: Warning Derivatives ──────────────────────────────────────────────
    colorWarningBg: '#fffbeb',
    colorWarningBorder: '#fcd34d',
    colorWarningHover: '#fbbf24',
    colorWarningActive: '#b45309',
    colorWarningText: '#d97706',

    // ─── Map: Error Derivatives ────────────────────────────────────────────────
    colorErrorBg: '#fff1f2',
    colorErrorBorder: '#fecdd3',
    colorErrorHover: '#fb7185',
    colorErrorActive: '#be123c',
    colorErrorText: '#e11d48',

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
        '0 6px 16px 0 rgba(59,42,26,0.10), 0 3px 6px -4px rgba(59,42,26,0.14), 0 9px 28px 8px rgba(59,42,26,0.06)',
    boxShadowSecondary:
        '0 6px 16px 0 rgba(59,42,26,0.10), 0 3px 6px -4px rgba(59,42,26,0.14), 0 9px 28px 8px rgba(59,42,26,0.06)',
    boxShadowTertiary:
        '0 1px 2px 0 rgba(59,42,26,0.04), 0 1px 6px -1px rgba(59,42,26,0.03), 0 2px 4px 0 rgba(59,42,26,0.03)',

    // ─── Alias: Background ─────────────────────────────────────────────────────
    colorBgContainerDisabled: '#f5ead7',
    colorBgTextHover: 'rgba(180,83,9,0.06)',
    colorBgTextActive: 'rgba(180,83,9,0.14)',
    colorBorderBg: '#fdf6e3',
    colorErrorOutline: 'rgba(220,38,38,0.06)',
    colorWarningOutline: 'rgba(217,119,6,0.1)',

    // ─── Alias: Fill ───────────────────────────────────────────────────────────
    colorFillAlter: 'rgba(180,83,9,0.03)',
    colorFillContent: 'rgba(180,83,9,0.06)',
    colorFillContentHover: 'rgba(180,83,9,0.14)',

    // ─── Alias: Icons & Dividers ───────────────────────────────────────────────
    colorHighlight: '#e11d48',
    colorIcon: 'rgba(59,42,26,0.45)',
    colorIconHover: '#b45309',
    colorSplit: 'rgba(180,83,9,0.10)',

    // ─── Alias: Text Variants ──────────────────────────────────────────────────
    colorTextHeading: '#3b2a1a',
    colorTextLabel: '#6b4c2a',
    colorTextDescription: '#9a7351',
    colorTextDisabled: '#c8a97e',
    colorTextPlaceholder: '#c8a97e',
    colorTextLightSolid: '#fdf6e3',

    // ─── Alias: Control Item ───────────────────────────────────────────────────
    controlInteractiveSize: 16,
    controlItemBgHover: 'rgba(180,83,9,0.06)',
    controlItemBgActive: '#fef3c7',
    controlItemBgActiveHover: '#fde68a',
    controlItemBgActiveDisabled: 'rgba(59,42,26,0.15)',
    controlOutline: 'rgba(180,83,9,0.14)',
    controlOutlineWidth: 2,

    // ─── Alias: Typography ─────────────────────────────────────────────────────
    fontSizeIcon: 12,
    fontWeightStrong: 600,

    // ─── Alias: Focus & Link ───────────────────────────────────────────────────
    lineWidthFocus: 3,
    linkDecoration: 'none',
    linkHoverDecoration: 'underline',
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
