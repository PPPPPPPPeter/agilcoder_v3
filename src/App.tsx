import { useAppState } from '@/hooks/useAppState'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ChatProvider } from '@/context/ChatContext'
import { Header } from '@/components/Header/Header'
import { MainArea } from '@/components/MainArea/MainArea'
import { Footer } from '@/components/Footer/Footer'

export default function App() {
  const [state, dispatch] = useAppState()

  useKeyboardShortcuts(
    () => dispatch({ type: 'UNDO' }),
    () => dispatch({ type: 'REDO' }),
  )

  return (
    <ChatProvider selectedPreset={state.selectedPreset}>
      <div className="h-screen flex flex-col overflow-hidden bg-panel-bg text-gray-900 select-none">
        <Header
          presets={state.presets}
          selectedPreset={state.selectedPreset}
          onSelectPreset={(preset) => dispatch({ type: 'SELECT_PRESET', payload: preset })}
          dispatch={dispatch}
        />
        <MainArea state={state} dispatch={dispatch} />
        <Footer />
      </div>
    </ChatProvider>
  )
}
