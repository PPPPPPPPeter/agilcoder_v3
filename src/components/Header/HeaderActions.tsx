import { Tooltip } from '@/primitives/Tooltip'
import { Download } from 'lucide-react'

export function HeaderActions() {
  return (
    <div className="flex items-center px-3 flex-shrink-0">
      <Tooltip content="Download source code" placement="bottom">
        <button
          className="w-7 h-7 flex items-center justify-center border border-panel-border rounded
            text-panel-muted hover:text-gray-700 hover:border-accent transition-colors duration-150"
          onClick={() => console.log('[StyleAgent] Export')}
        >
          <Download size={13} />
        </button>
      </Tooltip>
    </div>
  )
}
