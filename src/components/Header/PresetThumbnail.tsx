import { motion } from 'framer-motion'
import type { ContentPreset } from '@/types'

interface PresetThumbnailProps {
  preset: ContentPreset
  isSelected: boolean
  isHovered?: boolean
  index: number
  onClick: () => void
}

const CASE_META = {
  'academic-homepage': {
    bg: '#eff6ff',
    accent: '#3b82f6',
    icon: '🎓',
    badge: 'Academic',
  },
} as const

export function PresetThumbnail({ preset, isSelected, isHovered = false, index, onClick }: PresetThumbnailProps) {
  const meta = CASE_META[preset.caseName]

  return (
    <motion.div
      className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      onClick={onClick}
    >
      <div
        className="relative overflow-hidden transition-all duration-150"
        style={{
          width: 72,
          height: 44,
          borderRadius: 4,
          backgroundColor: meta.bg,
          border: isSelected
            ? `1.5px solid #1677ff`
            : isHovered
              ? `1.5px solid #f59e0b`
              : `1.5px solid #e8ecf0`,
          boxShadow: isSelected
            ? '0 0 0 2px rgba(22,119,255,0.2)'
            : isHovered
              ? '0 0 0 3px rgba(245,158,11,0.25)'
              : 'none',
          transform: 'scale(1)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={(e) => { if (!isSelected && !isHovered) (e.currentTarget as HTMLDivElement).style.borderColor = '#b0b7c3' }}
        onMouseLeave={(e) => { if (!isSelected && !isHovered) (e.currentTarget as HTMLDivElement).style.borderColor = '#e8ecf0' }}
      >
        {/* Wireframe layout lines */}
        <div className="absolute inset-0 flex flex-col" style={{ padding: 4, gap: 2 }}>
          {/* Nav row */}
          <div className="w-full h-1.5 rounded-sm opacity-30" style={{ backgroundColor: meta.accent }} />
          {/* Content rows */}
          <div className="w-3/4 h-1 rounded-sm opacity-20" style={{ backgroundColor: meta.accent }} />
          <div className="w-1/2 h-1 rounded-sm opacity-15" style={{ backgroundColor: meta.accent }} />
          {/* Bottom cards */}
          <div className="flex gap-1 flex-1 mt-0.5">
            <div className="flex-1 rounded-sm opacity-15" style={{ backgroundColor: meta.accent }} />
            <div className="flex-1 rounded-sm opacity-10" style={{ backgroundColor: meta.accent }} />
            <div className="flex-1 rounded-sm opacity-10" style={{ backgroundColor: meta.accent }} />
          </div>
        </div>

        {/* Case badge (top-left) */}
        <div
          className="absolute top-0.5 left-0.5 text-[7px] leading-none px-0.5 py-px rounded-sm font-medium opacity-70"
          style={{ backgroundColor: meta.accent + '22', color: meta.accent }}
        >
          {meta.badge}
        </div>
      </div>

      <span className="text-2xs text-panel-muted font-code truncate max-w-[96px]">
        Variant {index + 1}: {preset.label}
      </span>
    </motion.div>
  )
}
