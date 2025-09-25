/**
 * 開発用パビリオン情報の型定義
 * 設計書のスキーマに従って実装
 */
export type DevPavilion = {
  /** パビリオンの一意識別子 */
  readonly id: string;
  /** パビリオンの表示名称 */
  readonly name: string;
  /** 0〜1の正規化座標。null時は未設定 */
  readonly coordinate: { x: number; y: number } | null;
  /** 0〜1の正規化半径。null時はデフォルト適用 */
  readonly hitboxRadius: number | null;
};

/**
 * 座標値が有効範囲（0〜1）内かどうかを検証する
 * @param value - 検証する座標値
 * @returns 有効な場合true
 */
export function isValidCoordinate(value: number): boolean {
  return !isNaN(value) && isFinite(value) && value >= 0 && value <= 1;
}

/**
 * 半径値が有効範囲（null または 0〜1）内かどうかを検証する
 * @param value - 検証する半径値
 * @returns 有効な場合true
 */
export function isValidRadius(value: number | null): boolean {
  if (value === null) return true;
  return !isNaN(value) && isFinite(value) && value >= 0 && value <= 1;
}

/**
 * DevPavilionオブジェクトが有効かどうかを検証する
 * @param pavilion - 検証するDevPavilionオブジェクト
 * @returns 有効な場合true
 */
export function validateDevPavilion(pavilion: DevPavilion): boolean {
  // ID, 名前の必須チェック
  if (!pavilion.id || pavilion.id.trim() === '') return false;
  if (!pavilion.name || pavilion.name.trim() === '') return false;

  // 座標のバリデーション（nullまたは有効な座標）
  if (pavilion.coordinate !== null) {
    if (!isValidCoordinate(pavilion.coordinate.x) || !isValidCoordinate(pavilion.coordinate.y)) {
      return false;
    }
  }

  // 半径のバリデーション
  return isValidRadius(pavilion.hitboxRadius);


}