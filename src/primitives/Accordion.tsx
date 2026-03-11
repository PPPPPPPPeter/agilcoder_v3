import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface AccordionProps {
  title: string
  icon?: string
  description?: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function Accordion({ title, icon, description, isOpen, onToggle, children }: AccordionProps) {
  return (
    <div className="border-b border-panel-border">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-black/[0.03] transition-colors duration-150"
      >
        {icon && (
          <span className="text-sm w-5 text-center flex-shrink-0">{icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-800">{title}</div>
          {description && (
            <div className="text-2xs text-panel-muted truncate">{description}</div>
          )}
        </div>
        <ChevronDown
          size={12}
          className={`text-panel-muted flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
