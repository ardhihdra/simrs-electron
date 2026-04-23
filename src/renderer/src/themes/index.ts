import type { ThemeConfig } from 'antd'
import { lightToken } from './light.ts'
import { darkToken } from './dark.ts'
import { greenToken } from './green.ts'
import { retroToken } from './retro.ts'
import { desktopToken } from './desktop.ts'

/**
 * ─── Theme Registry ────────────────────────────────────────────────────────
 *
 * Untuk menambahkan tema baru:
 * 1. Buat file tema baru, misalnya `retro.ts` dengan export `retroToken`
 * 2. Import di sini dan tambahkan ke `THEME_REGISTRY`
 * 3. Selesai — ThemeProvider dan SettingsModal akan otomatis mengenali tema baru.
 */
export interface ThemeDefinition {
    /** Key unik tema, digunakan di localStorage dan URL params */
    key: string
    /** Label tampilan pada UI Settings */
    label: string
    /** Deskripsi singkat untuk UI Settings */
    desc: string
    /** Gradient CSS untuk preview strip di SettingsModal */
    previewGradient: string
    /** Algoritma Ant Design: 'default' | 'dark' */
    algorithm: 'default' | 'dark'
    /** Token Ant Design */
    token: ThemeConfig['token']
}

export const THEME_REGISTRY: Record<string, ThemeDefinition> = {
    light: {
        key: 'light',
        label: 'Light',
        desc: 'Tema terang bawaan — cocok untuk lingkungan pencahayaan normal',
        previewGradient: 'linear-gradient(135deg, #3b82f6 0%, #0958d9 100%)',
        algorithm: 'default',
        token: lightToken
    },
    dark: {
        key: 'dark',
        label: 'Dark',
        desc: 'Tema gelap — mengurangi kelelahan mata di lingkungan minim cahaya',
        previewGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        algorithm: 'dark',
        token: darkToken
    },
    green: {
        key: 'green',
        label: 'Medical Green',
        desc: 'Tema hijau medis khas BPJS Kesehatan & Kemenkes',
        previewGradient: 'linear-gradient(135deg, #007a3d 0%, #00a59a 100%)',
        algorithm: 'default',
        token: greenToken
    },
    retro: {
        key: 'retro',
        label: 'Retro Vintage',
        desc: 'Tema cokelat hangat bergaya klasik era 70-80an',
        previewGradient: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
        algorithm: 'default',
        token: retroToken
    },
    desktop: {
        key: 'desktop',
        label: 'Desktop',
        desc: 'Tema desktop hybrid dengan tone biru operasional dan density tinggi',
        previewGradient: 'linear-gradient(135deg, #4f6ef7 0%, #8ca2ff 100%)',
        algorithm: 'default',
        token: desktopToken
    }
}

/** Urutan tampilan tema di SettingsModal */
export const THEME_ORDER: string[] = ['light', 'dark', 'green', 'retro', 'desktop']

/** Type union otomatis dari semua key di THEME_REGISTRY */
export type ThemeMode = keyof typeof THEME_REGISTRY

export const DEFAULT_THEME_KEY: ThemeMode = 'light'
