import { useState } from 'react'
import { captureMapAsPng, downloadPng, buildFilename } from '../utils/imageGeneration'

export type DownloadButtonProps = {
  mapSelector: string
  className?: string
}

function DownloadButton({ mapSelector, className }: DownloadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const handleDownload = async () => {
    if (isProcessing) return

    setIsProcessing(true)
    setMessage('画像を生成しています…')

    try {
      const dataUrl = await captureMapAsPng(mapSelector)
      const filename = buildFilename()
      await downloadPng(dataUrl, filename)
      setMessage('画像をダウンロードしました')
    } catch (error) {
      console.error(error)
      setMessage('画像の生成に失敗しました')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={className}>
      <button onClick={handleDownload} disabled={isProcessing}>
        画像をダウンロード
      </button>
      <p role="status">{message}</p>
    </div>
  )
}

export default DownloadButton
