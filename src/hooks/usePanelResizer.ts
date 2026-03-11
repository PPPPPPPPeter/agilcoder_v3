import { useRef, useCallback } from 'react'

export function usePanelResizer(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onWidthChange: (leftPct: number) => void,
  minLeftPx = 400,
  minRightPx = 320,
) {
  const isDragging = useRef(false)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const clampedX = Math.max(minLeftPx, Math.min(relativeX, rect.width - minRightPx))
    const pct = (clampedX / rect.width) * 100
    onWidthChange(pct)
  }, [containerRef, minLeftPx, minRightPx, onWidthChange])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    document.body.classList.remove('resizing')
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.classList.add('resizing')
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove, handleMouseUp])

  return { handleMouseDown }
}
