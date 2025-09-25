import { Pavilion } from '../types/pavilion';

/**
 * 座標情報の型定義（ピクセル座標）
 */
export type PixelCoordinate = {
  readonly x: number;
  readonly y: number;
};

/**
 * マップサイズの型定義
 */
export type MapSize = {
  readonly width: number;
  readonly height: number;
};

/**
 * ヒットボックス判定用のパラメータ
 * テストとメイン機能の両方で使用
 */
export type HitboxTestParams = {
  readonly pavilions: readonly Pavilion[];
  readonly mapSize: MapSize;
  readonly defaultRadius: number;
};

/**
 * ヒットボックス判定の内部状態を表す型
 */
type HitboxState = {
  readonly center: PixelCoordinate;
  readonly radius: number;
};

/**
 * 正規化座標（0〜1）を実ピクセル座標に変換する
 * 設計書の要件に従い、座標正規化・スケーリング機能を提供
 *
 * @param normalizedValue - 0〜1の正規化座標値
 * @param mapDimension - マップの幅または高さ
 * @returns 実ピクセル座標値
 */
export function normalizeCoordinate(normalizedValue: number, mapDimension: number): number {
  return normalizedValue * mapDimension;
}

/**
 * 正規化座標をマップサイズに応じてピクセル座標にスケールする
 *
 * @param coordinate - 正規化座標（0〜1）
 * @param mapSize - マップサイズ
 * @returns ピクセル座標
 */
export function scaleCoordinate(coordinate: { x: number; y: number }, mapSize: MapSize): PixelCoordinate {
  return {
    x: normalizeCoordinate(coordinate.x, mapSize.width),
    y: normalizeCoordinate(coordinate.y, mapSize.height)
  };
}

/**
 * ヒットボックス半径をピクセル値で計算する
 * 設計書「9. 主要ロジック」に準拠：
 * const radiusPx = (hitboxRadius ?? defaultRadius) * mapWidth;
 *
 * @param pavilionRadius - パビリオン固有の半径（null/undefinedの場合はデフォルトを使用）
 * @param defaultRadius - デフォルト半径
 * @param mapWidth - マップ幅
 * @returns ピクセル単位の半径
 */
export function calculateHitboxRadius(
  pavilionRadius: number | null | undefined,
  defaultRadius: number,
  mapWidth: number
): number {
  const effectiveRadius = pavilionRadius ?? defaultRadius;
  return effectiveRadius * mapWidth;
}

/**
 * 2点間の距離の二乗を計算する（パフォーマンス最適化）
 * Math.sqrt()を避けることで高速化
 */
function getSquaredDistance(point1: PixelCoordinate, point2: PixelCoordinate): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return dx * dx + dy * dy;
}

/**
 * 円形ヒットボックス判定ロジック
 * 中心座標とカーソル位置の距離で判定
 * パフォーマンス最適化：平方根計算を避けるため距離の二乗で比較
 *
 * @param clickPoint - クリック位置（ピクセル座標）
 * @param pavilionCenter - パビリオン中心座標（ピクセル座標）
 * @param radiusPx - ヒットボックス半径（ピクセル単位）
 * @returns ヒットしているかどうか
 */
export function isPointInHitbox(
  clickPoint: PixelCoordinate,
  pavilionCenter: PixelCoordinate,
  radiusPx: number
): boolean {
  const squaredDistance = getSquaredDistance(clickPoint, pavilionCenter);
  const squaredRadius = radiusPx * radiusPx;
  return squaredDistance <= squaredRadius;
}

/**
 * マップ範囲内の座標かどうかを判定する
 * エッジケースの処理を分離して可読性向上
 */
function isPointInMapBounds(point: PixelCoordinate, mapSize: MapSize): boolean {
  return point.x >= 0 && point.x <= mapSize.width &&
         point.y >= 0 && point.y <= mapSize.height;
}

/**
 * パビリオンのヒットボックス状態を計算する
 * 計算処理を分離して再利用性向上
 */
function calculatePavilionHitbox(
  pavilion: Pavilion,
  mapSize: MapSize,
  defaultRadius: number
): HitboxState {
  const center = scaleCoordinate(pavilion.coordinate, mapSize);
  const radius = calculateHitboxRadius(
    pavilion.hitboxRadius,
    defaultRadius,
    mapSize.width
  );

  return { center, radius };
}

/**
 * クリック位置に該当するパビリオンを検索する
 * 重複領域では優先順位（JSON定義順）で解決
 * パフォーマンス最適化：早期return、計算の分離
 *
 * @param clickPoint - クリック位置（ピクセル座標）
 * @param params - ヒットボックス判定パラメータ
 * @returns ヒットしたパビリオン（見つからない場合はnull）
 */
export function findHitPavilion(
  clickPoint: PixelCoordinate,
  params: HitboxTestParams
): Pavilion | null {
  const { pavilions, mapSize, defaultRadius } = params;

  // エッジケース：マップ範囲外の座標チェック（早期return）
  if (!isPointInMapBounds(clickPoint, mapSize)) {
    return null;
  }

  // JSON定義順（配列順）でチェック。最初にヒットしたものを返す
  let closest: { pavilion: Pavilion; distance: number } | null = null;

  for (const pavilion of pavilions) {
    const hitbox = calculatePavilionHitbox(pavilion, mapSize, defaultRadius);

    if (isPointInHitbox(clickPoint, hitbox.center, hitbox.radius)) {
      const distance = getSquaredDistance(clickPoint, hitbox.center);
      if (!closest || distance < closest.distance) {
        closest = { pavilion, distance };
      }
    }
  }

  return closest ? closest.pavilion : null;
}