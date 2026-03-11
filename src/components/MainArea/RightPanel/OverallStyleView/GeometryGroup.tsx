import { Slider } from '@/primitives/Slider'
import { Toggle } from '@/primitives/Toggle'
import type { StyleValues } from '@/types'

interface GeometryGroupProps {
  values: StyleValues
  onChange: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
  onChangeEnd: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
}

export function GeometryGroup({ values, onChange, onChangeEnd }: GeometryGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Slider
            label="Border radius"
            value={values.borderRadius}
            min={0}
            max={24}
            onChange={(v) => onChange('borderRadius', v)}
            onChangeEnd={(v) => onChangeEnd('borderRadius', v)}
            showValue
            unit="px"
          />
        </div>
        {/* Live preview rect */}
        <div
          className="w-8 h-8 bg-accent/30 border border-accent/60 flex-shrink-0"
          style={{ borderRadius: `${values.borderRadius}px` }}
        />
      </div>
      <Toggle
        label="Uniform radius"
        checked={values.uniformRadius}
        onChange={(v) => onChangeEnd('uniformRadius', v)}
      />
    </div>
  )
}
