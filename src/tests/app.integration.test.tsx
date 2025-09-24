import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../App'
import type { Pavilion } from '../types/pavilion'

describe('App integration', () => {
  const samplePavilions: Pavilion[] = [
    {
      id: 'pavilion-1',
      name: '日本パビリオン',
      coordinate: { x: 0.5, y: 0.3 },
      hitboxRadius: 0.05,
    },
    {
      id: 'pavilion-2',
      name: '大阪パビリオン',
      coordinate: { x: 0.3, y: 0.7 },
      hitboxRadius: null,
    },
  ]

  beforeEach(() => {
    vi.resetAllMocks()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    if (typeof fetch === 'function' && 'mockRestore' in fetch) {
      ;(fetch as unknown as vi.Mock).mockRestore()
    }
    vi.unstubAllGlobals()
  })

  it('ローディング表示の後にマップと一覧を表示する', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => samplePavilions,
    }))

    render(<App />)

    expect(screen.getByTestId('loading-state')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /EXPO LOG/ })).toBeInTheDocument()
    })

    expect(screen.getByRole('img', { name: '大阪・関西万博マップ' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: '大阪パビリオン' })).toBeInTheDocument()
  })


  it('共有操作とダウンロードがマップ領域に配置される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => samplePavilions,
    }))

    render(<App />)

    const shareGroup = await screen.findByRole('group', { name: '共有設定' })
    const mapColumn = shareGroup.closest('[data-testid="map-column"]')
    expect(mapColumn).not.toBeNull()
  })

  it('読み取り専用モードのときチェックボックスが無効化される', async () => {
    window.history.replaceState({}, '', '/?mode=readonly')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => samplePavilions,
    }))

    render(<App />)

    const checkbox = await screen.findByRole('checkbox', { name: '大阪パビリオン' })
    expect(checkbox).toBeDisabled()
  })

  it('データ取得に失敗した場合に再試行ボタンを表示する', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => samplePavilions })

    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    const errorState = await screen.findByTestId('error-state')
    expect(errorState).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '再試行' }))

    await waitFor(() => {
      expect(screen.getByRole('img', { name: '大阪・関西万博マップ' })).toBeInTheDocument()
    })
  })
})
