interface PanelResizerProps {
  onMouseDown: (e: React.MouseEvent) => void
}

export function PanelResizer({ onMouseDown }: PanelResizerProps) {
  return (
    <div
      className="relative flex-shrink-0 cursor-col-resize flex items-center justify-center group"
      style={{ width: 5 }}
      onMouseDown={onMouseDown}
    >
      {/* Wider invisible hit area */}
      <div className="absolute inset-y-0 -left-2 -right-2 z-10" />

      {/* Visual bar */}
      <div
        className="w-px h-full bg-panel-border group-hover:bg-accent transition-colors duration-150"
      />
    </div>
  )
}
