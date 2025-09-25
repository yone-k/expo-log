import { MapSize, PixelCoordinate, scaleCoordinate } from './hitbox';

/**
 * ピクセル座標を正規化座標（0〜1）に変換する
 * 開発ツールでマップクリック位置を正規化座標に変換するために使用
 *
 * @param pixel - ピクセル座標
 * @param mapSize - マップサイズ
 * @returns 正規化座標（0〜1の範囲、ただし範囲外も許可）
 */
export function pixelToNormalized(
  pixel: PixelCoordinate,
  mapSize: MapSize
): { x: number; y: number } {
  return {
    x: pixel.x / mapSize.width,
    y: pixel.y / mapSize.height
  };
}

/**
 * 正規化座標をピクセル座標に変換する
 * 既存のscaleCoordinate関数のエイリアスとして提供
 *
 * @param normalized - 正規化座標
 * @param mapSize - マップサイズ
 * @returns ピクセル座標
 */
export function normalizedToPixel(
  normalized: { x: number; y: number },
  mapSize: MapSize
): PixelCoordinate {
  return scaleCoordinate(normalized, mapSize);
}

/**
 * 2点間のピクセル距離を正規化距離に変換する
 * 開発ツールで半径を正規化値として算出するために使用
 *
 * @param point1 - 第1のピクセル座標
 * @param point2 - 第2のピクセル座標
 * @param mapSize - マップサイズ
 * @returns 正規化距離（マップ幅を基準とした0〜1+の値）
 */
export function calculateNormalizedDistance(
  point1: PixelCoordinate,
  point2: PixelCoordinate,
  mapSize: MapSize
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);

  // マップ幅を基準として正規化
  return pixelDistance / mapSize.width;
}