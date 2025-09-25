import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from './App'
import type { Pavilion } from './types/pavilion'

describe('App', () => {
  const samplePavilions: Pavilion[] = [
    {
      id: 'pavilion-1',
      name: '日本パビリオン',
      coordinate: { x: 0.5, y: 0.3 },
      hitboxRadius: 0.05,
    },
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => samplePavilions,
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ロード中はステータスメッセージを表示する', () => {
    vi.unstubAllGlobals()
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

    render(<App />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('データ取得後にヘッダーを表示する', async () => {
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /EXPO LOG/ })).toBeInTheDocument()
    })
  })
})
