import { useMemo, useState } from 'react'
import { useVisitedState } from '../hooks/useVisitedState'
import { encodeVisitedStateToUrl } from '../utils/shareUrl'

const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
const SHARE_BUTTON_LABEL = '共有URLをコピー'
const SWITCH_BUTTON_LABEL = '編集する'

function ShareControls() {
  const {
    visitedState,
    pavilions,
    isEditMode,
    switchToEditMode,
  } = useVisitedState()

  const [copyFeedback, setCopyFeedback] = useState('')

  const shareUrl = useMemo(() => {
    const encoded = encodeVisitedStateToUrl(visitedState, pavilions)
    const params = new URLSearchParams({ mode: 'readonly' })
    if (encoded) {
      params.set('visited', encoded)
    }
    return `${baseUrl}?${params.toString()}`
  }, [visitedState, pavilions])

  const handleCopy = async () => {
    if (!isEditMode) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyFeedback('共有URLをコピーしました')
    } catch (error) {
      console.error('Failed to copy URL', error)
      setCopyFeedback('コピーに失敗しました')
    }
  }

  const handleSwitchMode = () => {
    if (!isEditMode) {
      switchToEditMode()
      setCopyFeedback('編集モードに切り替えました')
    }
  }

  return (
    <div className="share-controls" role="group" aria-label="共有設定">
      <div className="share-controls-actions">
        <button onClick={handleCopy} disabled={!isEditMode}>
          {SHARE_BUTTON_LABEL}
        </button>
        {!isEditMode && (
          <button onClick={handleSwitchMode}>
            {SWITCH_BUTTON_LABEL}
          </button>
        )}
      </div>
      <output aria-live="polite" data-testid="share-url" className="share-url-output">
        {shareUrl}
      </output>
      {copyFeedback && (
        <p role="status" data-testid="share-feedback" className="share-feedback">
          {copyFeedback}
        </p>
      )}
    </div>
  )
}

export default ShareControls
