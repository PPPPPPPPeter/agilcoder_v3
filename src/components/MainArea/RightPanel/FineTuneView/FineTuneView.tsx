import type { SelectedElement } from '@/types'
import { FineTuneEmptyState } from './FineTuneEmptyState'
import { SelectionHeader } from './SelectionHeader'
import { PropertyInspector } from './PropertyInspector'

interface FineTuneViewProps {
  selectedElements: SelectedElement[]
}

export function FineTuneView({ selectedElements }: FineTuneViewProps) {
  if (selectedElements.length === 0) {
    return <FineTuneEmptyState />
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SelectionHeader elements={selectedElements} />
      <PropertyInspector elements={selectedElements} />
    </div>
  )
}
