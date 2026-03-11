import { useRef, useCallback } from 'react'

export function useSlider(
  min: number,
  max: number,
  onChange: (value: number) => void,
  onChangeEnd?: (value: number) => void,
) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const isDragging = useRef(false)

  const getValueFromClientX = useCallback((clientX: number): number => {
    if (!trackRef.current) return min
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return min + pct * (max - min)
  }, [min, max])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    onChange(getValueFromClientX(e.clientX))
  }, [onChange, getValueFromClientX])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.classList.remove('slider-dragging')
    onChangeEnd?.(getValueFromClientX(e.clientX))
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [onChangeEnd, getValueFromClientX, handleMouseMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.classList.add('slider-dragging')
    // Immediately update on click
    onChange(getValueFromClientX(e.clientX))
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [onChange, getValueFromClientX, handleMouseMove, handleMouseUp])

  return { trackRef, handleMouseDown }
}
