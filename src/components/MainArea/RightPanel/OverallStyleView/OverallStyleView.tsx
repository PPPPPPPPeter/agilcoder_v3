import { Accordion } from '@/primitives/Accordion'
import { cssGroupDefs } from '@/data/mockData'
import type { StyleValues, CSSGroupId, AppAction } from '@/types'
import { MasterSlider } from './MasterSlider'
import { ColorPaletteGroup } from './ColorPaletteGroup'
import { TypographyGroup } from './TypographyGroup'
import { GeometryGroup } from './GeometryGroup'
import { SpacingGroup } from './SpacingGroup'
import { EffectsGroup } from './EffectsGroup'
import { AnimationGroup } from './AnimationGroup'

interface OverallStyleViewProps {
  prompt: string
  variantId: string
  values: StyleValues
  openAccordions: CSSGroupId[]
  dispatch: React.Dispatch<AppAction>
}

export function OverallStyleView({
  prompt,
  variantId,
  values,
  openAccordions,
  dispatch,
}: OverallStyleViewProps) {
  // Called during drag — updates preview live, no history
  const handleChangeLive = (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => {
    dispatch({ type: 'UPDATE_STYLE_VALUE_LIVE', payload: { variantId, key, value } })
  }

  // Called on drag end — writes to history
  const handleChange = (key: keyof StyleValues, value: StyleValues[keyof StyleValues]) => {
    dispatch({ type: 'UPDATE_STYLE_VALUE', payload: { variantId, key, value } })
    console.log('[StyleAgent] Patch:', { variantId, key, value })
  }

  const renderGroupBody = (id: CSSGroupId) => {
    const props = { values, onChange: handleChangeLive, onChangeEnd: handleChange }
    switch (id) {
      case 'color':      return <ColorPaletteGroup {...props} />
      case 'typography': return <TypographyGroup {...props} />
      case 'geometry':   return <GeometryGroup {...props} />
      case 'spacing':    return <SpacingGroup {...props} />
      case 'effects':    return <EffectsGroup {...props} />
      case 'animation':  return <AnimationGroup {...props} />
    }
  }

  return (
    <div className="flex flex-col overflow-y-auto scrollbar-thin flex-1">
      <MasterSlider
        prompt={prompt}
        value={values.masterIntensity}
        onChange={(v) => handleChangeLive('masterIntensity', v)}
        onChangeEnd={(v) => handleChange('masterIntensity', v)}
      />

      {cssGroupDefs.map((group) => (
        <Accordion
          key={group.id}
          title={group.label}
          icon={group.icon}
          description={group.description}
          isOpen={openAccordions.includes(group.id)}
          onToggle={() => dispatch({ type: 'TOGGLE_ACCORDION', payload: group.id })}
        >
          {renderGroupBody(group.id)}
        </Accordion>
      ))}
    </div>
  )
}
