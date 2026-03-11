import { useEffect } from 'react'

export function useKeyboardShortcuts(
  onUndo: () => void,
  onRedo: () => void,
) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const modifier = isMac ? e.metaKey : e.ctrlKey

      if (!modifier) return

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        onUndo()
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault()
        onRedo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onUndo, onRedo])
}
