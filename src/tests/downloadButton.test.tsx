import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import DownloadButton from '../components/DownloadButton'

vi.mock('../utils/imageGeneration', () => ({
  captureMapAsPng: vi.fn().mockResolvedValue('data:image/png;base64,AAAA'),
  downloadPng: vi.fn().mockResolvedValue(undefined),
  buildFilename: vi.fn().mockReturnValue('expo-visited-20250101.png'),
}))

describe('DownloadButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ダウンロードボタンを押すとPNG生成処理が呼び出される', async () => {
    render(<DownloadButton mapSelector="#map" />)

    const button = screen.getByRole('button', { name: '画像をダウンロード' })

    await act(async () => {
      fireEvent.click(button)
    })

    const { captureMapAsPng, downloadPng, buildFilename } = await import('../utils/imageGeneration')

    expect(captureMapAsPng).toHaveBeenCalledWith('#map')
    expect(buildFilename).toHaveBeenCalled()
    expect(downloadPng).toHaveBeenCalledWith('data:image/png;base64,AAAA', 'expo-visited-20250101.png')
    expect(screen.getByRole('status').textContent).toBe('画像をダウンロードしました')
  })
})
