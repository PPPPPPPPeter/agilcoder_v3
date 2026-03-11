import { useState, useRef, useEffect } from 'react'

interface ColorSwatchProps {
  color: string
  onChange: (color: string) => void
  label?: string
}

export function ColorSwatch({ color, onChange, label }: ColorSwatchProps) {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(color)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setHexInput(color) }, [color])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleHexChange = (val: string) => {
    setHexInput(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val)
  }

  return (
    <div className="relative flex items-center gap-2">
      {label && <span className="text-xs text-panel-muted flex-1">{label}</span>}
      <button
        onClick={() => setOpen(!open)}
        className="w-6 h-6 rounded border border-panel-border hover:border-accent transition-colors flex-shrink-0 shadow-sm"
        style={{ backgroundColor: color }}
        title={color}
      />

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-8 z-50 bg-white border border-panel-border rounded-lg shadow-xl p-3 w-44"
        >
          <div
            className="w-full h-14 rounded mb-2 border border-panel-border"
            style={{ backgroundColor: hexInput }}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-panel-muted font-code">#</span>
            <input
              type="text"
              value={hexInput.replace('#', '')}
              onChange={(e) => handleHexChange('#' + e.target.value)}
              className="flex-1 bg-panel-bg border border-panel-border rounded px-2 py-1
                text-xs font-code text-gray-900 outline-none focus:border-accent"
              maxLength={6}
              placeholder="1677ff"
            />
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => { onChange(e.target.value); setHexInput(e.target.value) }}
            className="w-full h-7 mt-2 rounded cursor-pointer border-0 bg-transparent"
          />
        </div>
      )}
    </div>
  )
}
