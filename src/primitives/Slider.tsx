import { useSlider } from '@/hooks/useSlider'

interface SliderProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
  label?: string
  leftLabel?: string
  rightLabel?: string
  unit?: string
  showValue?: boolean
  disabled?: boolean
}

export function Slider({
  value,
  min = 0,
  max = 100,
  onChange,
  onChangeEnd,
  label,
  leftLabel,
  rightLabel,
  unit,
  showValue = false,
  disabled = false,
}: SliderProps) {
  const { trackRef, handleMouseDown } = useSlider(min, max, onChange, onChangeEnd)
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-panel-muted">{label}</span>}
          {showValue && (
            <span className="text-xs font-code text-gray-700">
              {Math.round(value)}{unit ?? ''}
            </span>
          )}
        </div>
      )}

      <div
        className="relative h-5 flex items-center cursor-pointer"
        onMouseDown={!disabled ? handleMouseDown : undefined}
      >
        {/* Track */}
        <div ref={trackRef} className="absolute w-full h-1.5 rounded-full bg-panel-border">
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-accent"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className="absolute w-3 h-3 rounded-full bg-white border border-accent/40 shadow-sm cursor-grab active:cursor-grabbing
            transition-transform duration-75 hover:scale-125"
          style={{
            left: `calc(${pct}% - 6px)`,
            boxShadow: '0 0 0 2px rgba(22,119,255,0.25)',
          }}
        />
      </div>

      {(leftLabel || rightLabel) && (
        <div className="flex justify-between">
          {leftLabel && <span className="text-2xs text-panel-muted">{leftLabel}</span>}
          {rightLabel && <span className="text-2xs text-panel-muted">{rightLabel}</span>}
        </div>
      )}
    </div>
  )
}
