import { Slider } from '@/primitives/Slider'
import { Toggle } from '@/primitives/Toggle'
import type { StyleValues } from '@/types'

interface EffectsGroupProps {
  values: StyleValues
  onChange: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
  onChangeEnd: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
}

export function EffectsGroup({ values, onChange, onChangeEnd }: EffectsGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Shadow intensity"
        value={values.shadowIntensity}
        onChange={(v) => onChange('shadowIntensity', v)}
        onChangeEnd={(v) => onChangeEnd('shadowIntensity', v)}
        leftLabel="None"
        rightLabel="Strong"
      />
      <Slider
        label="Hover lift"
        value={values.hoverLift}
        min={0}
        max={8}
        onChange={(v) => onChange('hoverLift', v)}
        onChangeEnd={(v) => onChangeEnd('hoverLift', v)}
        showValue
        unit="px"
      />
      <Toggle
        label="Backdrop blur"
        checked={values.backdropBlur}
        onChange={(v) => onChangeEnd('backdropBlur', v)}
      />
    </div>
  )
}
