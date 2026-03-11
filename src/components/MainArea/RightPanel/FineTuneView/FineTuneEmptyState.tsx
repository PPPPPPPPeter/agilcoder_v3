import { MousePointer2 } from 'lucide-react'

export function FineTuneEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-panel-bg flex items-center justify-center">
        <MousePointer2 size={20} className="text-panel-muted" />
      </div>
      <div>
        <p className="text-sm text-gray-800 font-medium mb-1">No element selected</p>
        <p className="text-xs text-panel-muted leading-relaxed">
          Click an element in the preview to fine-tune its CSS properties
        </p>
      </div>
      <div className="text-2xs text-panel-muted border border-panel-border rounded px-3 py-1.5">
        Enable Feedback Mode first
      </div>
    </div>
  )
}
