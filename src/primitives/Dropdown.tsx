interface DropdownProps {
  value: string
  options: string[]
  onChange: (value: string) => void
  label?: string
}

export function Dropdown({ value, options, onChange, label }: DropdownProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-xs text-panel-muted flex-1">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-panel-bg border border-panel-border text-xs text-gray-800 rounded px-2 py-1
          outline-none focus:border-accent cursor-pointer hover:border-gray-400 transition-colors"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
