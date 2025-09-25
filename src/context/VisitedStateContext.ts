import { createContext } from 'react';
import type { Pavilion, VisitedState } from '../types/pavilion';

/**
 * 訪問状態管理のContext型定義
 */
export interface VisitedStateContextValue {
  /** 現在の訪問状態 */
  visitedState: VisitedState;
  /** 現在のモード（'edit' | 'readonly'） */
  mode: 'edit' | 'readonly';
  /** 編集モードかどうかの判定 */
  isEditMode: boolean;
  /** 訪問状態をトグルする関数 */
  toggleVisited: (pavilionId: string) => void;
  /** 読み取り専用モードから編集モードに切り替える関数 */
  switchToEditMode: () => void;
  /** パビリオン一覧 */
  pavilions: readonly Pavilion[];
  /** デフォルトのヒットボックス半径 */
  defaultHitboxRadius: number;
}

/**
 * 訪問状態管理Context
 */
export const VisitedStateContext = createContext<VisitedStateContextValue | null>(null);
