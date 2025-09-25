import { describe, it, expect } from 'vitest';
import {
  normalizeCoordinate,
  scaleCoordinate,
  calculateHitboxRadius,
  isPointInHitbox,
  findHitPavilion,
  type HitboxTestParams
} from '../utils/hitbox';
import { Pavilion } from '../types/pavilion';

describe('ヒットボックス判定機能', () => {
  const mockMapSize = { width: 800, height: 600 };
  const defaultRadius = 0.01; // デフォルト半径（マップ幅の1%）

  const testPavilions: Pavilion[] = [
    {
      id: 'jp-001',
      name: 'Japan Pavilion',
      coordinate: { x: 0.5, y: 0.3 },
      hitboxRadius: 0.03
    },
    {
      id: 'us-001',
      name: 'USA Pavilion',
      coordinate: { x: 0.7, y: 0.5 },
      hitboxRadius: null // デフォルト半径を使用
    },
    {
      id: 'uk-001',
      name: 'UK Pavilion',
      coordinate: { x: 0.2, y: 0.7 }, // USA Pavilionから離れた位置に変更
      hitboxRadius: 0.025
    }
  ];

  describe('normalizeCoordinate', () => {
    it('正規化座標（0〜1）を実ピクセル座標に変換する', () => {
      expect(normalizeCoordinate(0.5, 800)).toBe(400);
      expect(normalizeCoordinate(0, 800)).toBe(0);
      expect(normalizeCoordinate(1, 800)).toBe(800);
    });

    it('小数点以下の座標も正確に変換する', () => {
      expect(normalizeCoordinate(0.25, 800)).toBe(200);
      expect(normalizeCoordinate(0.75, 600)).toBe(450);
    });
  });

  describe('scaleCoordinate', () => {
    it('正規化座標をマップサイズに応じてスケールする', () => {
      const result = scaleCoordinate({ x: 0.5, y: 0.3 }, mockMapSize);
      expect(result).toEqual({ x: 400, y: 180 });
    });

    it('境界値（0, 1）を正しく変換する', () => {
      const result1 = scaleCoordinate({ x: 0, y: 0 }, mockMapSize);
      expect(result1).toEqual({ x: 0, y: 0 });

      const result2 = scaleCoordinate({ x: 1, y: 1 }, mockMapSize);
      expect(result2).toEqual({ x: 800, y: 600 });
    });
  });

  describe('calculateHitboxRadius', () => {
    it('パビリオン固有の半径がある場合はそれを使用する', () => {
      const radius = calculateHitboxRadius(0.03, defaultRadius, mockMapSize.width);
      expect(radius).toBe(24); // 0.03 * 800 = 24
    });

    it('パビリオン固有の半径がnullの場合はデフォルト半径を使用する', () => {
      const radius = calculateHitboxRadius(null, defaultRadius, mockMapSize.width);
      expect(radius).toBe(8); // 0.01 * 800 = 8
    });

    it('パビリオン固有の半径が未定義の場合はデフォルト半径を使用する', () => {
      const radius = calculateHitboxRadius(undefined, defaultRadius, mockMapSize.width);
      expect(radius).toBe(8); // 0.01 * 800 = 8
    });
  });

  describe('isPointInHitbox', () => {
    it('ヒットボックス内の座標でtrueを返す', () => {
      const pavilionCenter = { x: 400, y: 300 };
      const radiusPx = 20;

      // 中心点
      expect(isPointInHitbox({ x: 400, y: 300 }, pavilionCenter, radiusPx)).toBe(true);

      // 半径内の点
      expect(isPointInHitbox({ x: 410, y: 310 }, pavilionCenter, radiusPx)).toBe(true);
      expect(isPointInHitbox({ x: 390, y: 290 }, pavilionCenter, radiusPx)).toBe(true);
    });

    it('ヒットボックス外の座標でfalseを返す', () => {
      const pavilionCenter = { x: 400, y: 300 };
      const radiusPx = 20;

      // 半径外の点
      expect(isPointInHitbox({ x: 425, y: 300 }, pavilionCenter, radiusPx)).toBe(false);
      expect(isPointInHitbox({ x: 400, y: 325 }, pavilionCenter, radiusPx)).toBe(false);
    });

    it('境界値（半径上の点）で正しく判定する', () => {
      const pavilionCenter = { x: 400, y: 300 };
      const radiusPx = 20;

      // 半径ちょうどの点（境界は含む）
      expect(isPointInHitbox({ x: 420, y: 300 }, pavilionCenter, radiusPx)).toBe(true);
      expect(isPointInHitbox({ x: 380, y: 300 }, pavilionCenter, radiusPx)).toBe(true);
    });
  });

  describe('findHitPavilion', () => {
    const hitboxParams: HitboxTestParams = {
      pavilions: testPavilions,
      mapSize: mockMapSize,
      defaultRadius
    };

    it('ヒット対象がない場合はnullを返す', () => {
      const result = findHitPavilion({ x: 100, y: 100 }, hitboxParams);
      expect(result).toBeNull();
    });

    it('単一のパビリオンがヒットした場合はそのパビリオンを返す', () => {
      // Japan Pavilion (x: 400, y: 180, radius: 24) の中心付近をクリック
      const result = findHitPavilion({ x: 400, y: 180 }, hitboxParams);
      expect(result?.id).toBe('jp-001');
    });

    it('デフォルト半径を使用するパビリオンでも正しく判定する', () => {
      // USA Pavilion (x: 560, y: 300, radius: 8) の中心付近をクリック
      const result = findHitPavilion({ x: 560, y: 300 }, hitboxParams);
      expect(result?.id).toBe('us-001');
    });

    it('重複領域ではより近いパビリオンを優先する（既存データ）', () => {
      // テスト用に近接したパビリオンを作成
      const overlappingPavilions: Pavilion[] = [
        {
          id: 'first-pavilion',
          name: 'First Pavilion',
          coordinate: { x: 0.5, y: 0.5 },
          hitboxRadius: 0.05
        },
        {
          id: 'second-pavilion',
          name: 'Second Pavilion',
          coordinate: { x: 0.52, y: 0.52 }, // 重複する位置
          hitboxRadius: 0.05
        }
      ];

      const overlapParams: HitboxTestParams = {
        pavilions: overlappingPavilions,
        mapSize: mockMapSize,
        defaultRadius
      };

      // 重複領域をクリック（両方のヒットボックス内）
      const overlapPoint = { x: 410, y: 310 }; // 重複領域内の点
      const result = findHitPavilion(overlapPoint, overlapParams);

      // second-pavilionの方がクリック地点に近い
      expect(result?.id).toBe('second-pavilion');
    });

    it('重複領域では最も近いパビリオンを優先する', () => {
      const overlappingPavilions: Pavilion[] = [
        {
          id: 'near',
          name: 'Near Pavilion',
          coordinate: { x: 0.5, y: 0.5 },
          hitboxRadius: 0.1,
        },
        {
          id: 'far',
          name: 'Far Pavilion',
          coordinate: { x: 0.6, y: 0.6 },
          hitboxRadius: 0.1,
        },
      ]

      const overlapParams: HitboxTestParams = {
        pavilions: overlappingPavilions,
        mapSize: mockMapSize,
        defaultRadius,
      }

      const closerToFar = { x: 460, y: 340 }
      expect(findHitPavilion(closerToFar, overlapParams)?.id).toBe('far')

      const closerToNear = { x: 410, y: 310 }
      expect(findHitPavilion(closerToNear, overlapParams)?.id).toBe('near')
    })

    it('エッジケース：マップ範囲外の座標でnullを返す', () => {
      const result1 = findHitPavilion({ x: -10, y: 100 }, hitboxParams);
      expect(result1).toBeNull();

      const result2 = findHitPavilion({ x: 900, y: 100 }, hitboxParams);
      expect(result2).toBeNull();

      const result3 = findHitPavilion({ x: 400, y: -10 }, hitboxParams);
      expect(result3).toBeNull();

      const result4 = findHitPavilion({ x: 400, y: 700 }, hitboxParams);
      expect(result4).toBeNull();
    });

    it('マップサイズが変更されても正しくスケールする', () => {
      const largerMapSize = { width: 1600, height: 1200 };
      const largerMapParams: HitboxTestParams = {
        pavilions: testPavilions,
        mapSize: largerMapSize,
        defaultRadius
      };

      // スケール後: Japan Pavilion (x: 800, y: 360, radius: 48)
      const result = findHitPavilion({ x: 800, y: 360 }, largerMapParams);
      expect(result?.id).toBe('jp-001');
    });
  });

  describe('統合テスト：実際のクリック判定シナリオ', () => {
    const hitboxParams: HitboxTestParams = {
      pavilions: testPavilions,
      mapSize: mockMapSize,
      defaultRadius
    };

    it('複数パビリオンの異なる位置での判定', () => {
      // Japan Pavilion
      expect(findHitPavilion({ x: 400, y: 180 }, hitboxParams)?.id).toBe('jp-001');

      // USA Pavilion
      expect(findHitPavilion({ x: 560, y: 300 }, hitboxParams)?.id).toBe('us-001');

      // UK Pavilion（UK座標: x: 160, y: 420, radius: 20）
      expect(findHitPavilion({ x: 160, y: 420 }, hitboxParams)?.id).toBe('uk-001');

      // 何もヒットしない位置
      expect(findHitPavilion({ x: 200, y: 500 }, hitboxParams)).toBeNull();
    });
  });
});
