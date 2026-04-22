export interface DesktopKeyboardShortcutProps {
  keys: string[]
}

export function DesktopKeyboardShortcut({ keys }: DesktopKeyboardShortcutProps) {
  return (
    <span className="inline-flex items-center gap-[var(--ds-space-xxs)]">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex min-w-[22px] items-center justify-center rounded-[var(--ds-radius-sm)] border border-[var(--ds-color-border-strong)] bg-[var(--ds-color-surface)] px-[var(--ds-space-xs)] py-[2px] font-mono text-[length:var(--ds-font-size-caption)] text-[var(--ds-color-text-muted)] shadow-[var(--ds-shadow-xs)]"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
