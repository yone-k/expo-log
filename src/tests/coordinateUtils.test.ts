import { describe, it, expect } from 'vitest';
import { pixelToNormalized, normalizedToPixel, calculateNormalizedDistance } from '../utils/coordinateUtils';
import { MapSize, PixelCoordinate } from '../utils/hitbox';

describe('座標変換ユーティリティ', () => {
  const mapSize: MapSize = { width: 800, height: 600 };

  describe('pixelToNormalized', () => {
    it('ピクセル座標を正規化座標に変換する', () => {
      const pixel: PixelCoordinate = { x: 400, y: 300 };
      const result = pixelToNormalized(pixel, mapSize);

      expect(result.x).toBe(0.5);
      expect(result.y).toBe(0.5);
    });

    it('左上角（0,0）を正規化座標（0,0）に変換する', () => {
      const pixel: PixelCoordinate = { x: 0, y: 0 };
      const result = pixelToNormalized(pixel, mapSize);

      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('右下角を正規化座標（1,1）に変換する', () => {
      const pixel: PixelCoordinate = { x: 800, y: 600 };
      const result = pixelToNormalized(pixel, mapSize);

      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('範囲外の座標もそのまま変換する', () => {
      const pixel: PixelCoordinate = { x: -100, y: 900 };
      const result = pixelToNormalized(pixel, mapSize);

      expect(result.x).toBe(-0.125);
      expect(result.y).toBe(1.5);
    });
  });

  describe('normalizedToPixel', () => {
    it('既存のscaleCoordinateと同じ結果を返す', () => {
      const normalized = { x: 0.5, y: 0.5 };
      const result = normalizedToPixel(normalized, mapSize);

      expect(result.x).toBe(400);
      expect(result.y).toBe(300);
    });
  });

  describe('calculateNormalizedDistance', () => {
    it('2点間の正規化距離を計算する', () => {
      const point1: PixelCoordinate = { x: 0, y: 0 };
      const point2: PixelCoordinate = { x: 800, y: 0 };
      const distance = calculateNormalizedDistance(point1, point2, mapSize);

      // 横幅全体の距離なので正規化距離は1.0
      expect(distance).toBe(1.0);
    });

    it('中心から1/4の距離を正しく計算する', () => {
      const center: PixelCoordinate = { x: 400, y: 300 };
      const quarter: PixelCoordinate = { x: 600, y: 300 };
      const distance = calculateNormalizedDistance(center, quarter, mapSize);

      // 幅の1/4なので正規化距離は0.25
      expect(distance).toBe(0.25);
    });

    it('対角線の距離を正しく計算する', () => {
      const point1: PixelCoordinate = { x: 0, y: 0 };
      const point2: PixelCoordinate = { x: 800, y: 600 };
      const distance = calculateNormalizedDistance(point1, point2, mapSize);

      // ピクセル距離: sqrt(800^2 + 600^2) = 1000
      // 正規化距離: 1000 / 800 = 1.25
      expect(distance).toBe(1.25);
    });
  });
});