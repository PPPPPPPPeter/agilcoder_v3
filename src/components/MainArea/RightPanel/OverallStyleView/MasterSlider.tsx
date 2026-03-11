import { useSlider } from '@/hooks/useSlider'
import { useState } from 'react'

interface MasterSliderProps {
  prompt: string
  value: number
  onChange: (value: number) => void
  onChangeEnd?: (value: number) => void
}

export function MasterSlider({ prompt, value, onChange, onChangeEnd }: MasterSliderProps) {
  const [leftAnchor, setLeftAnchor] = useState(0)
  const [rightAnchor, setRightAnchor] = useState(100)

  const mainPct = ((value - leftAnchor) / (rightAnchor - leftAnchor)) * 100

  const { trackRef, handleMouseDown } = useSlider(leftAnchor, rightAnchor, onChange, onChangeEnd)

  const leftAnchorSlider = useSlider(0, rightAnchor - 5, (v) => {
    setLeftAnchor(Math.round(v))
    if (value < v) onChange(Math.round(v))
  })

  const rightAnchorSlider = useSlider(leftAnchor + 5, 100, (v) => {
    setRightAnchor(Math.round(v))
    if (value > v) onChange(Math.round(v))
  })

  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-b border-panel-border">
      <div className="flex items-center justify-between">
        <span className="text-xs text-panel-muted">Style intensity</span>
        <span className="text-xs font-code text-accent">
          "{prompt || 'futuristic'}"
        </span>
      </div>

      {/* Master slider track */}
      <div
        className="relative h-8 flex items-center cursor-pointer"
        onMouseDown={handleMouseDown}
      >
        {/* Track background */}
        <div ref={trackRef} className="absolute w-full h-2 rounded-full bg-panel-border overflow-hidden">
          {/* Gradient fill in active range */}
          <div
            className="absolute top-0 h-full rounded-full"
            style={{
              left: `${leftAnchor}%`,
              width: `${rightAnchor - leftAnchor}%`,
              background: `linear-gradient(to right, rgba(22,119,255,0.25), #1677ff)`,
            }}
          />
          {/* Value fill */}
          <div
            className="absolute top-0 left-0 h-full bg-accent/70"
            style={{ width: `${leftAnchor + (mainPct / 100) * (rightAnchor - leftAnchor)}%` }}
          />
        </div>

        {/* Left anchor diamond */}
        <div
          className="absolute z-10 cursor-col-resize"
          style={{ left: `calc(${leftAnchor}% - 6px)` }}
          onMouseDown={(e) => { e.stopPropagation(); leftAnchorSlider.handleMouseDown(e) }}
        >
          <div
            className="w-3 h-3 border border-accent/50 bg-panel-surface shadow-sm"
            style={{ transform: 'rotate(45deg)' }}
            title="Left anchor"
          />
        </div>

        {/* Right anchor diamond */}
        <div
          className="absolute z-10 cursor-col-resize"
          style={{ left: `calc(${rightAnchor}% - 6px)` }}
          onMouseDown={(e) => { e.stopPropagation(); rightAnchorSlider.handleMouseDown(e) }}
        >
          <div
            className="w-3 h-3 border border-accent/50 bg-panel-surface shadow-sm"
            style={{ transform: 'rotate(45deg)' }}
            title="Right anchor"
          />
        </div>

        {/* Main thumb */}
        <div
          className="absolute z-20 w-4 h-4 rounded-full bg-accent shadow-md cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${leftAnchor + (mainPct / 100) * (rightAnchor - leftAnchor)}% - 8px)`,
            boxShadow: '0 0 0 3px rgba(22,119,255,0.25)',
          }}
        />
      </div>

      <div className="flex justify-between">
        <span className="text-2xs text-panel-muted">← Less</span>
        <span className="text-2xs text-panel-muted">More →</span>
      </div>
    </div>
  )
}
