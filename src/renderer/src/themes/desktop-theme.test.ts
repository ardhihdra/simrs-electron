import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDesktopCssVariables,
  buildDesktopTailwindThemeVariables,
  desktopThemeTokens
} from '../components/design-system/foundation/desktop-theme.ts'
import { THEME_ORDER, THEME_REGISTRY } from './index.ts'

test('theme registry exposes the desktop theme', () => {
  assert.equal(THEME_REGISTRY.desktop?.key, 'desktop')
  assert.equal(THEME_REGISTRY.desktop?.label, 'Desktop')
  assert.ok(THEME_ORDER.includes('desktop'))
})

test('desktop theme tokens use Inter and hybrid desktop sizing', () => {
  assert.equal(desktopThemeTokens.typography.fontFamilySans, 'Inter')
  assert.equal(desktopThemeTokens.layout.moduleBarHeight, 40)
  assert.equal(desktopThemeTokens.components.table.headerHeight, 40)
})

test('desktop css variables are generated from centralized tokens', () => {
  const cssVars = buildDesktopCssVariables(desktopThemeTokens)

  assert.equal(cssVars['--ds-font-sans'], 'Inter')
  assert.equal(cssVars['--ds-layout-modulebar-h'], '40px')
  assert.equal(cssVars['--ds-table-header-h'], '40px')
  assert.equal(cssVars['--ds-color-accent'], desktopThemeTokens.colors.accent)
})

test('desktop tailwind theme variables are generated from centralized tokens', () => {
  const themeVars = buildDesktopTailwindThemeVariables(desktopThemeTokens)

  assert.equal(themeVars['--theme-spacing-ds-menu-item'], '34px')
  assert.equal(themeVars['--theme-spacing-ds-modulebar'], '40px')
  assert.equal(themeVars['--theme-color-ds-surface'], desktopThemeTokens.colors.surface)
  assert.equal(themeVars['--theme-radius-ds-md'], '6px')
  assert.equal(themeVars['--theme-shadow-ds-md'], desktopThemeTokens.shadow.md)
  assert.equal(themeVars['--theme-text-ds-title'], '22px')
})
