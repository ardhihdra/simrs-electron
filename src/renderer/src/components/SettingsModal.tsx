import { Modal, theme } from 'antd'
import { useTheme } from '@renderer/providers/theme-context'
import { THEME_REGISTRY, THEME_ORDER } from '@renderer/themes/index'
import type { ThemeMode } from '@renderer/providers/theme-context'

interface SettingsModalProps {
  open: boolean
  onCancel: () => void
}

export default function SettingsModal({ open, onCancel }: SettingsModalProps) {
  const { themeMode, setThemeMode } = useTheme()
  const { token } = theme.useToken()

  const orderedThemes = THEME_ORDER.map((key) => THEME_REGISTRY[key]).filter(Boolean)

  return (
    <Modal title="Pengaturan Tampilan" open={open} onCancel={onCancel} footer={null} width={480}>
      <div className="py-2">
        <p className="text-sm mb-4" style={{ color: token.colorTextTertiary }}>
          Pilih tema tampilan antarmuka. Preferensi disimpan otomatis.
        </p>

        <div className="flex flex-col gap-3">
          {orderedThemes.map((opt) => {
            const isActive = themeMode === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setThemeMode(opt.key as ThemeMode)}
                className="w-full text-left rounded-xl transition-all duration-200 overflow-hidden cursor-pointer"
                style={{
                  borderWidth: 2,
                  borderStyle: 'solid',
                  borderColor: isActive ? token.colorPrimary : token.colorBorderSecondary,
                  background: isActive ? token.colorPrimaryBg : token.colorBgContainer,
                  boxShadow: isActive ? `0 0 0 2px ${token.colorPrimaryBgHover}` : 'none'
                }}
              >
                <div className="flex items-center gap-4 p-3">
                  {/* Preview strip */}
                  <div
                    className="w-12 h-12 rounded-lg shrink-0"
                    style={{ background: opt.previewGradient }}
                  />

                  {/* Label & desc */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm" style={{ color: token.colorText }}>
                        {opt.label}
                      </span>
                      {isActive && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: token.colorPrimary,
                            color: token.colorTextLightSolid
                          }}
                        >
                          Aktif
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs m-0 leading-relaxed"
                      style={{ color: token.colorTextTertiary }}
                    >
                      {opt.desc}
                    </p>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      borderColor: isActive ? token.colorPrimary : token.colorBorderSecondary
                    }}
                  >
                    {isActive && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: token.colorPrimary }}
                      />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-center mt-4" style={{ color: token.colorTextQuaternary }}>
          Preferensi tema tersimpan di browser storage.
        </p>
      </div>
    </Modal>
  )
}
