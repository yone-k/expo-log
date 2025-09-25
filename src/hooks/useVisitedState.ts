import { useContext } from 'react';
import { VisitedStateContext, type VisitedStateContextValue } from '../context/VisitedStateContext';

/**
 * 訪問状態管理のカスタムフック
 * VisitedStateProvider内でのみ使用可能
 *
 * 要件：
 * - 型安全なContextアクセス
 * - エラーハンドリング（Provider外での使用検知）
 * - Context値の直接返却
 *
 * パフォーマンス最適化：
 * - Context値は Provider 側でメモ化されているため、
 *   このフック自体でのメモ化は不要
 * - useContext の結果をそのまま返すことで、
 *   不要な再レンダリングを防止
 *
 * @returns VisitedStateContextValue
 * @throws Error Provider外で使用された場合
 */
export function useVisitedState(): VisitedStateContextValue {
  const context = useContext(VisitedStateContext);

  if (context === null) {
    throw new Error(
      'useVisitedState must be used within VisitedStateProvider'
    );
  }

  return context;
}
