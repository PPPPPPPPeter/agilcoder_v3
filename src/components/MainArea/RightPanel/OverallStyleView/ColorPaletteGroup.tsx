import { ColorSwatch } from '@/primitives/ColorSwatch'
import { Slider } from '@/primitives/Slider'
import type { StyleValues } from '@/types'

interface ColorPaletteGroupProps {
  values: StyleValues
  onChange: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
  onChangeEnd: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
}

export function ColorPaletteGroup({ values, onChange, onChangeEnd }: ColorPaletteGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <ColorSwatch
          label="Background"
          color={values.bgColor}
          onChange={(c) => onChangeEnd('bgColor', c)}
        />
        <ColorSwatch
          label="Text"
          color={values.textColor}
          onChange={(c) => onChangeEnd('textColor', c)}
        />
        <ColorSwatch
          label="Accent"
          color={values.accentPrimary}
          onChange={(c) => onChangeEnd('accentPrimary', c)}
        />
        <ColorSwatch
          label="Secondary"
          color={values.accentSecondary}
          onChange={(c) => onChangeEnd('accentSecondary', c)}
        />
      </div>
      <Slider
        label="Contrast"
        value={values.contrast}
        onChange={(v) => onChange('contrast', v)}
        onChangeEnd={(v) => onChangeEnd('contrast', v)}
        leftLabel="Low"
        rightLabel="High"
        showValue
        unit="%"
      />
    </div>
  )
}
