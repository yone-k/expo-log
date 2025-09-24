import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { ReactNode } from 'react'
import { VisitedStateProvider } from '../context/VisitedStateProvider'
import { useVisitedState } from '../hooks/useVisitedState'
import type { Pavilion } from '../types/pavilion'
import MapCanvas from '../features/map/MapCanvas'

const mockPavilions: Pavilion[] = [
  {
    id: 'pavilion-1',
    name: 'パビリオン1',
    coordinate: { x: 0.5, y: 0.3 },
    hitboxRadius: 0.03,
  },
  {
    id: 'pavilion-2',
    name: 'パビリオン2',
    coordinate: { x: 0.7, y: 0.6 },
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

function VisitedCountDisplay() {
  const { visitedState } = useVisitedState()
  const visitedCount = Object.values(visitedState).filter(Boolean).length
  return <div data-testid="visited-count-display">{visitedCount}</div>
}

describe('MapCanvas', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
    vi.resetAllMocks()
  })

  it('地図画像を表示する', () => {
    renderWithProvider(
      <>
        <MapCanvas />
        <VisitedCountDisplay />
      </>,
    )

    expect(
      screen.getByRole('img', { name: '大阪・関西万博マップ' }),
    ).toBeInTheDocument()
  })

  it('訪問済みパビリオンにピンを表示する', () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ 'pavilion-1': true }),
    )

    renderWithProvider(
      <>
        <MapCanvas />
        <VisitedCountDisplay />
      </>,
    )

    expect(
      screen.getByRole('img', { name: 'パビリオン1の訪問済みピン' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('visited-count-display').textContent).toBe('1')
  })

  it('編集モードではクリックで訪問状態をトグルできる', async () => {
    renderWithProvider(
      <>
        <MapCanvas />
        <VisitedCountDisplay />
      </>,
    )

    const map = screen.getByTestId('map-canvas')

    Object.defineProperty(map, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })

    await act(async () => {
      fireEvent.click(map, { clientX: 400, clientY: 180 })
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1)
    await screen.findByRole('img', { name: 'パビリオン1の訪問済みピン' })
  })

  it('読み取り専用モードではクリックしても訪問状態が変化しない', async () => {
    renderWithProvider(
      <>
        <MapCanvas />
        <VisitedCountDisplay />
      </>,
      { initialMode: 'readonly' },
    )

    const map = screen.getByTestId('map-canvas')

    Object.defineProperty(map, 'getBoundingClientRect', {
      value: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })

    await act(async () => {
      fireEvent.click(map, { clientX: 400, clientY: 180 })
    })

    expect(
      screen.queryByRole('img', { name: 'パビリオン1の訪問済みピン' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('visited-count-display').textContent).toBe('0')
  })
})
