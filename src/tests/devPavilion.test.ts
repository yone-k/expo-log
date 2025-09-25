import { describe, it, expect } from 'vitest';
import { DevPavilion, validateDevPavilion, isValidCoordinate, isValidRadius } from '../types/devPavilion';

describe('DevPavilion型とバリデーション', () => {
  describe('isValidCoordinate', () => {
    it('有効な座標値（0〜1の範囲）でtrueを返す', () => {
      expect(isValidCoordinate(0)).toBe(true);
      expect(isValidCoordinate(0.5)).toBe(true);
      expect(isValidCoordinate(1)).toBe(true);
    });

    it('無効な座標値でfalseを返す', () => {
      expect(isValidCoordinate(-0.1)).toBe(false);
      expect(isValidCoordinate(1.1)).toBe(false);
      expect(isValidCoordinate(NaN)).toBe(false);
      expect(isValidCoordinate(Infinity)).toBe(false);
    });
  });

  describe('isValidRadius', () => {
    it('nullでtrueを返す', () => {
      expect(isValidRadius(null)).toBe(true);
    });

    it('有効な半径値（0〜1の範囲）でtrueを返す', () => {
      expect(isValidRadius(0)).toBe(true);
      expect(isValidRadius(0.03)).toBe(true);
      expect(isValidRadius(1)).toBe(true);
    });

    it('無効な半径値でfalseを返す', () => {
      expect(isValidRadius(-0.1)).toBe(false);
      expect(isValidRadius(1.1)).toBe(false);
      expect(isValidRadius(NaN)).toBe(false);
      expect(isValidRadius(Infinity)).toBe(false);
    });
  });

  describe('validateDevPavilion', () => {
    const validPavilion: DevPavilion = {
      id: 'test-001',
      name: 'テストパビリオン',
      coordinate: { x: 0.5, y: 0.5 },
      hitboxRadius: 0.03
    };

    it('有効なDevPavilionでtrueを返す', () => {
      expect(validateDevPavilion(validPavilion)).toBe(true);
    });

    it('coordinateがnullの場合でもtrueを返す', () => {
      const pavilionWithNullCoordinate: DevPavilion = {
        ...validPavilion,
        coordinate: null
      };
      expect(validateDevPavilion(pavilionWithNullCoordinate)).toBe(true);
    });

    it('hitboxRadiusがnullの場合でもtrueを返す', () => {
      const pavilionWithNullRadius: DevPavilion = {
        ...validPavilion,
        hitboxRadius: null
      };
      expect(validateDevPavilion(pavilionWithNullRadius)).toBe(true);
    });

    it('無効な座標でfalseを返す', () => {
      const invalidCoordinate: DevPavilion = {
        ...validPavilion,
        coordinate: { x: 1.5, y: 0.5 }
      };
      expect(validateDevPavilion(invalidCoordinate)).toBe(false);
    });

    it('無効な半径でfalseを返す', () => {
      const invalidRadius: DevPavilion = {
        ...validPavilion,
        hitboxRadius: -0.1
      };
      expect(validateDevPavilion(invalidRadius)).toBe(false);
    });

    it('空のIDでfalseを返す', () => {
      const emptyId: DevPavilion = {
        ...validPavilion,
        id: ''
      };
      expect(validateDevPavilion(emptyId)).toBe(false);
    });

    it('空の名前でfalseを返す', () => {
      const emptyName: DevPavilion = {
        ...validPavilion,
        name: ''
      };
      expect(validateDevPavilion(emptyName)).toBe(false);
    });
  });
});