interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <div className={`flex items-center justify-between gap-2 ${disabled ? 'opacity-40' : ''}`}>
      {label && <span className="text-xs text-panel-muted flex-1">{label}</span>}
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full
          transition-colors duration-150 focus:outline-none
          ${checked ? 'bg-accent' : 'bg-panel-border'}`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform duration-150
            ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}
