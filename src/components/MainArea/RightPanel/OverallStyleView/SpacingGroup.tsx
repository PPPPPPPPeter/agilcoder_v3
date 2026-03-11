import { Slider } from '@/primitives/Slider'
import type { StyleValues } from '@/types'

interface SpacingGroupProps {
  values: StyleValues
  onChange: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
  onChangeEnd: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
}

export function SpacingGroup({ values, onChange, onChangeEnd }: SpacingGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Density"
        value={values.density}
        onChange={(v) => onChange('density', v)}
        onChangeEnd={(v) => onChangeEnd('density', v)}
        leftLabel="Compact"
        rightLabel="Spacious"
      />
      <Slider
        label="Section gap"
        value={values.sectionGap}
        min={16}
        max={64}
        onChange={(v) => onChange('sectionGap', v)}
        onChangeEnd={(v) => onChangeEnd('sectionGap', v)}
        showValue
        unit="px"
      />
    </div>
  )
}
