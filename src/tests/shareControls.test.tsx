import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ReactNode } from 'react'
import { VisitedStateProvider } from '../context/VisitedStateProvider'
import ShareControls from '../components/ShareControls'
import type { Pavilion } from '../types/pavilion'

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
})

const mockPavilions: Pavilion[] = [
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

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

function renderWithProvider(
  ui: ReactNode,
  options?: {
    initialMode?: 'edit' | 'readonly'
    initialVisited?: string
    pavilions?: Pavilion[]
    defaultHitboxRadius?: number
  },
) {
  const {
    initialMode = 'edit',
    initialVisited = '',
    pavilions = mockPavilions,
    defaultHitboxRadius = 0.02,
  } = options ?? {}

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <VisitedStateProvider
        initialMode={initialMode}
        initialVisited={initialVisited}
        pavilions={pavilions}
        defaultHitboxRadius={defaultHitboxRadius}
      >
        {children}
      </VisitedStateProvider>
    )
  }

  return render(ui, { wrapper: Wrapper })
}

describe('ShareControls', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
    vi.resetAllMocks()
  })

  it('編集モードで共有URLを生成してクリップボードにコピーできる', async () => {
    renderWithProvider(<ShareControls />)

    const copyButton = screen.getByRole('button', { name: '共有URLをコピー' })
    await act(async () => {
      fireEvent.click(copyButton)
    })

    expect(navigator.clipboard.writeText).toHaveBeenCalled()
    const feedback = await screen.findByTestId('share-feedback')
    expect(feedback.textContent).toBe('共有URLをコピーしました')
    expect(screen.getByTestId('share-url').textContent).toContain('mode=readonly')
    expect(screen.queryByRole('button', { name: '編集する' })).toBeNull()
  })

  it('読み取り専用モードでは共有URLボタンが無効化される', () => {
    renderWithProvider(<ShareControls />, { initialMode: 'readonly' })

    const copyButton = screen.getByRole('button', { name: '共有URLをコピー' })
    expect(copyButton).toBeDisabled()
    expect(screen.getByRole('button', { name: '編集する' })).toBeInTheDocument()
  })

  it('読み取り専用モードから編集モードへ切り替える', async () => {
    renderWithProvider(<ShareControls />, { initialMode: 'readonly' })

    const switchButton = screen.getByRole('button', { name: '編集する' })
    await act(async () => {
      fireEvent.click(switchButton)
    })

    const feedback = await screen.findByTestId('share-feedback')
    expect(feedback.textContent).toBe('編集モードに切り替えました')
    expect(screen.queryByRole('button', { name: '編集する' })).toBeNull()
  })
})
