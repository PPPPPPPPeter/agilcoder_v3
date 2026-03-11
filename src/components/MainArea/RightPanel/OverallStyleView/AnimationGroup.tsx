import { Slider } from '@/primitives/Slider'
import { Toggle } from '@/primitives/Toggle'
import type { StyleValues } from '@/types'

interface AnimationGroupProps {
  values: StyleValues
  onChange: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
  onChangeEnd: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
}

export function AnimationGroup({ values, onChange, onChangeEnd }: AnimationGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <Slider
        label="Transition speed"
        value={values.transitionSpeed}
        min={0}
        max={500}
        onChange={(v) => onChange('transitionSpeed', v)}
        onChangeEnd={(v) => onChangeEnd('transitionSpeed', v)}
        showValue
        unit="ms"
      />
      <Toggle
        label="Entrance animations"
        checked={values.entranceAnimations}
        onChange={(v) => onChangeEnd('entranceAnimations', v)}
      />
      <Toggle
        label="Hover animations"
        checked={values.hoverAnimations}
        onChange={(v) => onChangeEnd('hoverAnimations', v)}
      />
    </div>
  )
}
