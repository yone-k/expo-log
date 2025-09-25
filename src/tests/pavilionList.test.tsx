import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReactNode } from 'react'
import { VisitedStateProvider } from '../context/VisitedStateProvider'
import type { Pavilion } from '../types/pavilion'
import PavilionList from '../features/list/PavilionList'

const mockPavilions: Pavilion[] = [
  {
    id: 'pavilion-3',
    name: '関西パビリオン',
    coordinate: { x: 0.8, y: 0.4 },
    hitboxRadius: 0.03,
  },
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
    defaultHitboxRadius = 0.01,
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

describe('PavilionList', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
    vi.resetAllMocks()
  })

  it('名前順にパビリオンを表示する', () => {
    renderWithProvider(<PavilionList />)

    const checkboxes = screen.getAllByRole('checkbox')
    const labels = checkboxes.map(checkbox => checkbox.closest('label')?.textContent?.trim())

    expect(labels).toEqual([
      '関西パビリオン',
      '大阪パビリオン',
      '日本パビリオン',
    ])
  })

  it('編集モードではチェックボックスで訪問状態をトグルできる', () => {
    renderWithProvider(<PavilionList />)

    const checkbox = screen.getByRole('checkbox', { name: '日本パビリオン' })

    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('読み取り専用モードではチェックボックスが無効化される', () => {
    renderWithProvider(<PavilionList />, { initialMode: 'readonly' })

    const checkbox = screen.getByRole('checkbox', { name: '日本パビリオン' })

    expect(checkbox).toBeDisabled()

    fireEvent.click(checkbox)

    expect(checkbox).not.toBeChecked()
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('検索入力で一覧をフィルタリングできる', () => {
    renderWithProvider(<PavilionList />)

    const searchBox = screen.getByRole('searchbox', { name: 'パビリオンを検索' })

    fireEvent.change(searchBox, { target: { value: '大阪' } })

    const visibleCheckboxes = screen.getAllByRole('checkbox')
    expect(visibleCheckboxes).toHaveLength(1)
    expect(visibleCheckboxes[0]).toHaveAccessibleName('大阪パビリオン')

    // 一致しない語で空結果を確認
    fireEvent.change(searchBox, { target: { value: '東京' } })
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.getByText('該当するパビリオンがありません')).toBeInTheDocument()

    // クリアで再び全件表示
    fireEvent.change(searchBox, { target: { value: '' } })
    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
  })
})
