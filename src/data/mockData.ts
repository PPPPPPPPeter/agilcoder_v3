import type { CSSGroupDef } from '@/types'

// ─── UI Config (not mock data) ────────────────────────────────────────────────

export const cssGroupDefs: CSSGroupDef[] = [
  { id: 'color',      label: 'Color Palette', icon: '🎨', description: 'Background, text, and accent colors' },
  { id: 'typography', label: 'Typography',    icon: 'Aa', description: 'Font families, sizes, and weights'   },
  { id: 'geometry',   label: 'Geometry',      icon: '▢',  description: 'Border radius, corners, and shapes'  },
  { id: 'spacing',    label: 'Spacing',       icon: '↔',  description: 'Margins, padding, and gaps'          },
  { id: 'effects',    label: 'Effects',       icon: '✦',  description: 'Shadows, blurs, and hover effects'   },
  { id: 'animation',  label: 'Animation',     icon: '▶',  description: 'Transitions and keyframe animations' },
]

export const HEADING_FONTS = [
  'Space Grotesk',
  'Playfair Display',
  'DM Serif Display',
  'Outfit',
  'Sora',
]

export const BODY_FONTS = [
  'DM Sans',
  'Work Sans',
  'IBM Plex Sans',
  'Crimson Pro',
]
