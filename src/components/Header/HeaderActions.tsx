import { useState, useRef, useEffect } from 'react'
import { Tooltip } from '@/primitives/Tooltip'
import { Download, Settings, Check, X } from 'lucide-react'
import { setApiKey, hasApiKey } from '@/api/llmService'

// ─── ApiKeySettings popover ────────────────────────────────────────────────────

function ApiKeySettings() {
  const [open,  setOpen]  = useState(false)
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(() => hasApiKey())
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  // Close on click-outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus input when popover opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const handleSave = () => {
    setApiKey(value.trim())
    setSaved(hasApiKey())
    if (hasApiKey()) {
      setValue('')
      setOpen(false)
    }
  }

  const handleClear = () => {
    setApiKey('')
    setSaved(false)
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={popoverRef}>
      <Tooltip content="API key settings" placement="bottom">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-7 h-7 flex items-center justify-center border rounded transition-colors duration-150 relative
            ${saved
              ? 'border-green-500/40 text-green-600 hover:border-green-500 bg-green-500/5'
              : 'border-panel-border text-panel-muted hover:text-gray-700 hover:border-accent'
            }`}
        >
          <Settings size={13} />
          {/* Status dot — green = configured, red = not set */}
          <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full
            ${saved ? 'bg-green-500' : 'bg-red-400'}`}
          />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-64 bg-panel-surface border border-panel-border rounded-lg shadow-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">Anthropic API Key</span>
            <span className={`flex items-center gap-1 text-xs ${saved ? 'text-green-600' : 'text-red-400'}`}>
              {saved
                ? <><Check size={11} /><span>configured</span></>
                : <><X size={11} /><span>not set</span></>
              }
            </span>
          </div>

          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={saved ? '••••••••••••••••' : 'sk-ant-…'}
            className="w-full text-xs bg-panel-bg border border-panel-border rounded px-2 py-1.5
              text-gray-800 placeholder:text-panel-muted outline-none focus:border-accent/60 transition-colors"
          />

          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={!value.trim()}
              className={`flex-1 py-1 rounded text-xs font-medium transition-all
                ${value.trim()
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-panel-border text-panel-muted cursor-not-allowed'
                }`}
            >
              Save
            </button>
            {saved && (
              <button
                onClick={handleClear}
                className="px-2 py-1 rounded text-xs text-red-400 border border-red-400/30
                  hover:bg-red-400/10 transition-all"
                title="Remove saved API key"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-[10px] text-panel-muted leading-relaxed">
            Stored in memory only — never saved to disk or localStorage.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function HeaderActions() {
  return (
    <div className="flex items-center gap-1.5 px-3 flex-shrink-0">
      <ApiKeySettings />

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
