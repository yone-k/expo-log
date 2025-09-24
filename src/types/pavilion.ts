/**
 * 座標情報の型定義
 * 0〜1の正規化座標値
 */
export type Coordinate = {
  readonly x: number;
  readonly y: number;
};

/**
 * パビリオン情報の型定義
 * 設計書のスキーマに従って実装
 */
export type Pavilion = {
  /** パビリオンの一意識別子 (例: "jp-001") */
  readonly id: string;
  /** パビリオンの表示名称 */
  readonly name: string;
  /** 0〜1の正規化座標 */
  readonly coordinate: Coordinate;
  /** 0〜1の正規化半径。null/未指定時はデフォルト適用 */
  readonly hitboxRadius?: number | null;
};

/**
 * 訪問状態の型定義
 * パビリオンIDをキーとしたboolean値のマップ
 */
export type VisitedState = Record<string, boolean>;