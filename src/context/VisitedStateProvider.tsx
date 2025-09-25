import { ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import type { Pavilion, VisitedState } from '../types/pavilion';
import { decodeVisitedStateFromUrl, encodeVisitedStateToUrl } from '../utils/shareUrl';
import { VisitedStateContext, type VisitedStateContextValue } from './VisitedStateContext';

/**
 * VisitedStateProviderのProps型定義
 */
export interface VisitedStateProviderProps {
  children: ReactNode;
  /** 初期モード */
  initialMode: 'edit' | 'readonly';
  /** 共有URLからの初期訪問状態（Base64URLエンコード済み） */
  initialVisited: string;
  /** パビリオン一覧 */
  pavilions: readonly Pavilion[];
  /** デフォルトのヒットボックス半径 */
  defaultHitboxRadius: number;
}

/**
 * ローカルストレージキー
 */
const STORAGE_KEY = 'expo-visited';

/**
 * 訪問状態オブジェクトの型安全性を検証する
 * パフォーマンス最適化：型チェックの分離
 */
function isValidVisitedState(value: unknown): value is VisitedState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  // すべてのキーが文字列で、すべての値がbooleanであることを確認
  return Object.entries(value).every(
    ([key, val]) => typeof key === 'string' && typeof val === 'boolean'
  );
}

/**
 * ローカルストレージから訪問状態を安全に読み込む
 * エラーハンドリングと型安全性を強化
 */
function loadFromLocalStorage(): VisitedState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return {};
    }

    const parsed: unknown = JSON.parse(saved);

    if (isValidVisitedState(parsed)) {
      return parsed;
    }

    // 不正な形式の場合は警告を出力
    console.warn('Invalid visitedState format in localStorage');
  } catch (error) {
    // ローカルストレージが利用できない、またはJSONパース失敗の場合
    console.warn('Failed to load from localStorage:', error);
  }
  return {};
}

/**
 * ローカルストレージに訪問状態を安全に保存する
 * エラーハンドリングを含む
 */
function saveToLocalStorage(visitedState: VisitedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedState));
  } catch (error) {
    // ローカルストレージが利用できない場合はログ出力のみ
    console.warn('Failed to save to localStorage:', error);
  }
}

/**
 * 共有URLから訪問状態を復元する
 * エラーハンドリングを含む
 */
function restoreFromSharedUrl(
  encodedVisited: string,
  pavilions: readonly Pavilion[]
): VisitedState {
  if (!encodedVisited) {
    return {};
  }

  try {
    return decodeVisitedStateFromUrl(encodedVisited, pavilions);
  } catch (error) {
    // 不正なURLパラメータの場合は空の状態を返す
    console.warn('Failed to decode shared URL:', error);
    return {};
  }
}

/**
 * 初期訪問状態を決定する
 * モードに応じてローカルストレージまたは共有URLから復元
 */
function getInitialVisitedState(
  mode: 'edit' | 'readonly',
  initialVisited: string,
  pavilions: readonly Pavilion[]
): VisitedState {
  if (mode === 'readonly') {
    // 読み取り専用モードでは共有URLから復元
    return restoreFromSharedUrl(initialVisited, pavilions);
  } else {
    // 編集モードではローカルストレージから復元
    return loadFromLocalStorage();
  }
}

/**
 * 訪問状態管理のContext Provider
 * 要件定義書5.5節「訪問状態の保存」と5.6節「共有URL」に準拠
 */
export function VisitedStateProvider({
  children,
  initialMode,
  initialVisited,
  pavilions,
  defaultHitboxRadius
}: VisitedStateProviderProps) {
  // 初期状態の決定
  const [visitedState, setVisitedState] = useState<VisitedState>(() =>
    getInitialVisitedState(initialMode, initialVisited, pavilions)
  );

  const [mode, setMode] = useState<'edit' | 'readonly'>(initialMode);

  // 編集モード判定
  const isEditMode = useMemo(() => mode === 'edit', [mode]);

  // パビリオンIDの有効性チェック（パフォーマンス最適化：Setを使用）
  const validPavilionIds = useMemo(
    () => new Set(pavilions.map(pavilion => pavilion.id)),
    [pavilions]
  );

  const isValidPavilionId = useCallback(
    (pavilionId: string): boolean => {
      return validPavilionIds.has(pavilionId);
    },
    [validPavilionIds]
  );

  // 訪問状態をトグルする関数（最適化版）
  const toggleVisited = useCallback(
    (pavilionId: string) => {
      // 読み取り専用モードでは操作を無視（早期return）
      if (!isEditMode) {
        return;
      }

      // 存在しないパビリオンIDは無視（早期return）
      if (!isValidPavilionId(pavilionId)) {
        return;
      }

      setVisitedState(prev => {
        const currentValue = prev[pavilionId];
        const newValue = !currentValue;

        // 値に変更がない場合は早期return（パフォーマンス最適化）
        if (currentValue === newValue) {
          return prev;
        }

        const newState = {
          ...prev,
          [pavilionId]: newValue
        };

        // ローカルストレージに保存（非同期実行）
        saveToLocalStorage(newState);

        return newState;
      });
    },
    [isEditMode, isValidPavilionId]
  );

  // 読み取り専用モードから編集モードに切り替える関数
  const switchToEditMode = useCallback(() => {
    if (mode === 'readonly') {
      // 現在の訪問状態をローカルストレージに保存
      saveToLocalStorage(visitedState);

      // モードを編集に切り替え
      setMode('edit');
    }
  }, [mode, visitedState]);

  // URLクエリを現在状態へ同期
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('mode', mode);

    const encodedVisited = encodeVisitedStateToUrl(visitedState, pavilions);
    if (encodedVisited) {
      params.set('visited', encodedVisited);
    } else {
      params.delete('visited');
    }

    const search = params.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [mode, visitedState, pavilions]);

  // Context値をメモ化してパフォーマンス最適化
  // パビリオンと半径は変更が稀なため分離してメモ化
  const stableConfig = useMemo(
    () => ({ pavilions, defaultHitboxRadius }),
    [pavilions, defaultHitboxRadius]
  );

  const contextValue = useMemo(
    (): VisitedStateContextValue => ({
      visitedState,
      mode,
      isEditMode,
      toggleVisited,
      switchToEditMode,
      ...stableConfig
    }),
    [
      visitedState,
      mode,
      isEditMode,
      toggleVisited,
      switchToEditMode,
      stableConfig
    ]
  );

  return (
    <VisitedStateContext.Provider value={contextValue}>
      {children}
    </VisitedStateContext.Provider>
  );
}
