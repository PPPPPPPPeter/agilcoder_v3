import { Dropdown } from '@/primitives/Dropdown'
import { Slider } from '@/primitives/Slider'
import { HEADING_FONTS, BODY_FONTS } from '@/data/mockData'
import type { StyleValues } from '@/types'

interface TypographyGroupProps {
  values: StyleValues
  onChange: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
  onChangeEnd: (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => void
}

export function TypographyGroup({ values, onChange, onChangeEnd }: TypographyGroupProps) {
  return (
    <div className="flex flex-col gap-3">
      <Dropdown
        label="Heading font"
        value={values.headingFont}
        options={HEADING_FONTS}
        onChange={(v) => onChangeEnd('headingFont', v)}
      />
      <Dropdown
        label="Body font"
        value={values.bodyFont}
        options={BODY_FONTS}
        onChange={(v) => onChangeEnd('bodyFont', v)}
      />
      <Slider
        label="Base size"
        value={values.baseSize}
        min={12}
        max={20}
        onChange={(v) => onChange('baseSize', v)}
        onChangeEnd={(v) => onChangeEnd('baseSize', v)}
        showValue
        unit="px"
      />
      <Slider
        label="Line height"
        value={values.lineHeight}
        min={1.2}
        max={2.0}
        onChange={(v) => onChange('lineHeight', v)}
        onChangeEnd={(v) => onChangeEnd('lineHeight', v)}
        showValue
      />
    </div>
  )
}
