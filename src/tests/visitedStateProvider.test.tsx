import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';
import type { Pavilion } from '../types/pavilion';
import { VisitedStateProvider } from '../context/VisitedStateProvider';
import { useVisitedState } from '../hooks/useVisitedState';

// テスト用のモックパビリオンデータ
const mockPavilions: Pavilion[] = [
  {
    id: 'pavilion-1',
    name: 'パビリオン1',
    coordinate: { x: 0.1, y: 0.2 },
    hitboxRadius: 0.05
  },
  {
    id: 'pavilion-2',
    name: 'パビリオン2',
    coordinate: { x: 0.8, y: 0.3 },
    hitboxRadius: null
  },
  {
    id: 'pavilion-3',
    name: 'パビリオン3',
    coordinate: { x: 0.5, y: 0.7 },
    hitboxRadius: undefined
  }
];

// localStorageのモック
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// テスト用のヘルパー関数：カスタムProviderでラップ
function renderWithProvider(
  ui: ReactNode,
  options?: {
    initialMode?: 'edit' | 'readonly';
    initialVisited?: string;
    pavilions?: Pavilion[];
    defaultHitboxRadius?: number;
  }
) {
  const {
    initialMode = 'edit',
    initialVisited = '',
    pavilions = mockPavilions,
    defaultHitboxRadius = 0.02
  } = options || {};

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
    );
  }

  return render(ui, { wrapper: Wrapper });
}

// テスト用コンポーネント：状態を表示・操作
function TestComponent() {
  const { visitedState, mode, isEditMode, toggleVisited, switchToEditMode } = useVisitedState();

  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <div data-testid="is-edit-mode">{isEditMode.toString()}</div>
      <div data-testid="visited-count">{Object.keys(visitedState).filter(id => visitedState[id]).length}</div>
      <button
        data-testid="toggle-pavilion-1"
        onClick={() => toggleVisited('pavilion-1')}
      >
        Toggle Pavilion 1
      </button>
      <button
        data-testid="switch-to-edit"
        onClick={switchToEditMode}
      >
        Switch to Edit
      </button>
    </div>
  );
}

describe('VisitedStateProvider', () => {
  beforeEach(() => {
    // localStorageのモックを設定
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Context Providerの初期化', () => {
    it('編集モードで初期化される', () => {
      renderWithProvider(<TestComponent />, { initialMode: 'edit' });

      expect(screen.getByTestId('mode')).toHaveTextContent('edit');
      expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('true');
    });

    it('読み取り専用モードで初期化される', () => {
      renderWithProvider(<TestComponent />, { initialMode: 'readonly' });

      expect(screen.getByTestId('mode')).toHaveTextContent('readonly');
      expect(screen.getByTestId('is-edit-mode')).toHaveTextContent('false');
    });

    it('初期状態では訪問状態が空である', () => {
      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');
    });

    it('共有URLから初期訪問状態を復元する', () => {
      // Base64URLエンコードされた訪問状態（pavilion-1のみ訪問済み）をモック
      const encodedVisited = 'AQOg'; // "101"をBase64URLエンコード

      renderWithProvider(<TestComponent />, {
        initialVisited: encodedVisited,
        initialMode: 'readonly'
      });

      expect(screen.getByTestId('visited-count')).toHaveTextContent('2');
    });
  });

  describe('訪問状態の更新機能', () => {
    it('編集モードで訪問状態をトグルできる', async () => {
      renderWithProvider(<TestComponent />, { initialMode: 'edit' });

      const toggleButton = screen.getByTestId('toggle-pavilion-1');

      // 最初は未訪問
      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');

      // クリックして訪問済みに変更
      await act(async () => {
        toggleButton.click();
      });

      expect(screen.getByTestId('visited-count')).toHaveTextContent('1');

      // 再度クリックして未訪問に戻す
      await act(async () => {
        toggleButton.click();
      });

      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');
    });

    it('読み取り専用モードでは訪問状態を変更できない', async () => {
      renderWithProvider(<TestComponent />, { initialMode: 'readonly' });

      const toggleButton = screen.getByTestId('toggle-pavilion-1');

      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');

      // クリックしても変更されない
      await act(async () => {
        toggleButton.click();
      });

      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');
    });
  });

  describe('ローカルストレージとの連携', () => {
    it('編集モード初期化時にローカルストレージから状態を復元する', () => {
      const savedState = JSON.stringify({ 'pavilion-1': true, 'pavilion-2': false });
      mockLocalStorage.getItem.mockReturnValue(savedState);

      renderWithProvider(<TestComponent />, { initialMode: 'edit' });

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('expo-visited');
      expect(screen.getByTestId('visited-count')).toHaveTextContent('1');
    });

    it('訪問状態の更新時にローカルストレージに保存する', async () => {
      renderWithProvider(<TestComponent />, { initialMode: 'edit' });

      const toggleButton = screen.getByTestId('toggle-pavilion-1');

      await act(async () => {
        toggleButton.click();
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'expo-visited',
        expect.stringContaining('pavilion-1')
      );
    });

    it('読み取り専用モードではローカルストレージを読み込まない', () => {
      mockLocalStorage.getItem.mockReturnValue('{"pavilion-1": true}');

      renderWithProvider(<TestComponent />, { initialMode: 'readonly' });

      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('ローカルストレージが利用できない場合のエラーハンドリング', () => {
      // localStorageのアクセスでエラーを投げる
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage is not available');
      });

      expect(() => {
        renderWithProvider(<TestComponent />, { initialMode: 'edit' });
      }).not.toThrow();

      // エラーが発生してもアプリは動作続行
      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');
    });
  });

  describe('モード切り替え機能', () => {
    it('読み取りモードから編集モードに切り替えられる', async () => {
      const encodedVisited = 'AQOg'; // テスト用の訪問状態
      renderWithProvider(<TestComponent />, {
        initialMode: 'readonly',
        initialVisited: encodedVisited
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('readonly');

      const switchButton = screen.getByTestId('switch-to-edit');

      await act(async () => {
        switchButton.click();
      });

      expect(screen.getByTestId('mode')).toHaveTextContent('edit');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'expo-visited',
        expect.any(String)
      );
    });

    it('編集モードから読み取りモードには切り替えられない', async () => {
      renderWithProvider(<TestComponent />, { initialMode: 'edit' });

      const switchButton = screen.getByTestId('switch-to-edit');

      await act(async () => {
        switchButton.click();
      });

      // 編集モードのまま変わらない
      expect(screen.getByTestId('mode')).toHaveTextContent('edit');
    });
  });

  describe('共有URL状態復元', () => {
    it('不正なBase64URL文字列に対してエラーハンドリングを行う', () => {
      expect(() => {
        renderWithProvider(<TestComponent />, {
          initialMode: 'readonly',
          initialVisited: 'invalid-base64-url-string!!!'
        });
      }).not.toThrow();

      // エラーが発生しても初期状態で動作続行
      expect(screen.getByTestId('visited-count')).toHaveTextContent('0');
    });

    it('パビリオン数と不整合なビット列に対してエラーハンドリングを行う', () => {
      // 実際のパビリオン数（3）より長いビット列
      const invalidEncoded = 'AQfA'; // 長すぎるビット列

      expect(() => {
        renderWithProvider(<TestComponent />, {
          initialMode: 'readonly',
          initialVisited: invalidEncoded
        });
      }).not.toThrow();
    });
  });

  describe('Context外での使用エラー', () => {
    it('useVisitedStateをProvider外で使用した場合エラーになる', () => {
      // コンソールエラーを抑制
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useVisitedState());
      }).toThrow('useVisitedState must be used within VisitedStateProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('パビリオンデータとのバリデーション', () => {
    it('存在しないパビリオンIDに対してトグル操作は無視される', async () => {
      const { result } = renderHook(() => useVisitedState(), {
        wrapper: ({ children }) => (
          <VisitedStateProvider
            initialMode="edit"
            initialVisited=""
            pavilions={mockPavilions}
            defaultHitboxRadius={0.02}
          >
            {children}
          </VisitedStateProvider>
        )
      });

      const initialCount = Object.keys(result.current.visitedState).filter(
        id => result.current.visitedState[id]
      ).length;

      await act(async () => {
        result.current.toggleVisited('non-existent-pavilion');
      });

      const afterCount = Object.keys(result.current.visitedState).filter(
        id => result.current.visitedState[id]
      ).length;

      expect(afterCount).toBe(initialCount);
    });
  });
});