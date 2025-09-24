import { describe, it, expect } from 'vitest';

// 実装前のテストなのでモックを使ってインポート（REDフェーズ）
// これらの関数は後でGREENフェーズで実装される
import {
  encodeVisitedStateToUrl,
  decodeVisitedStateFromUrl,
  createBitString,
  parseBitString,
  encodeBase64URL,
  decodeBase64URL,
} from '../utils/shareUrl';
import type { Pavilion, VisitedState } from '../types/pavilion';

describe('pavilionState', () => {
  // テスト用のサンプルデータ
  const samplePavilions: Pavilion[] = [
    {
      id: 'jp-001',
      name: '日本パビリオン',
      coordinate: { x: 0.5, y: 0.3 },
      hitboxRadius: 0.05,
    },
    {
      id: 'jp-002',
      name: '大阪パビリオン',
      coordinate: { x: 0.3, y: 0.7 },
      hitboxRadius: null,
    },
    {
      id: 'jp-003',
      name: '関西パビリオン',
      coordinate: { x: 0.8, y: 0.4 },
      hitboxRadius: 0.03,
    },
  ];

  const sampleVisitedState: VisitedState = {
    'jp-001': true,
    'jp-002': false,
    'jp-003': true,
  };

  describe('ビット列変換機能', () => {
    it('訪問状態をパビリオンID昇順でビット列に変換する', () => {
      const result = createBitString(sampleVisitedState, samplePavilions);
      // jp-001: true(1), jp-002: false(0), jp-003: true(1) = "101"
      expect(result).toBe('101');
    });

    it('空の訪問状態から空のビット列を生成する', () => {
      const emptyVisited: VisitedState = {};
      const result = createBitString(emptyVisited, samplePavilions);
      // すべて未訪問 = "000"
      expect(result).toBe('000');
    });

    it('ビット列を訪問状態オブジェクトに変換する', () => {
      const bitString = '101';
      const result = parseBitString(bitString, samplePavilions);
      expect(result).toEqual({
        'jp-001': true,
        'jp-002': false,
        'jp-003': true,
      });
    });

    it('空のビット列から空の訪問状態を復元する', () => {
      const bitString = '';
      const result = parseBitString(bitString, []);
      expect(result).toEqual({});
    });

    it('ビット列の長さがパビリオン数と異なる場合のエラーハンドリング', () => {
      const shortBitString = '10'; // 3つのパビリオンに対して2文字
      expect(() => {
        parseBitString(shortBitString, samplePavilions);
      }).toThrow('ビット列の長さがパビリオン数と一致しません');

      const longBitString = '1010'; // 3つのパビリオンに対して4文字
      expect(() => {
        parseBitString(longBitString, samplePavilions);
      }).toThrow('ビット列の長さがパビリオン数と一致しません');
    });
  });

  describe('Base64URLエンコード/デコード機能', () => {
    it('ビット列をBase64URLエンコードする', () => {
      const bitString = '101';
      const result = encodeBase64URL(bitString);
      // Base64URLエンコードの結果は実装によるが、デコード可能であることを確認
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Base64URL文字セットのみを含むことを確認
      expect(result).toMatch(/^[A-Za-z0-9_-]*$/);
    });

    it('Base64URL文字列をビット列にデコードする', () => {
      const bitString = '101';
      const encoded = encodeBase64URL(bitString);
      const decoded = decodeBase64URL(encoded);
      expect(decoded).toBe(bitString);
    });

    it('不正なBase64URL文字列のエラーハンドリング', () => {
      const invalidBase64URL = 'invalid+/string='; // 標準Base64文字が含まれている
      expect(() => {
        decodeBase64URL(invalidBase64URL);
      }).toThrow('不正なBase64URL文字列です');

      const malformedString = '!!!';
      expect(() => {
        decodeBase64URL(malformedString);
      }).toThrow('不正なBase64URL文字列です');
    });

    it('空文字列のエンコード/デコード', () => {
      const encoded = encodeBase64URL('');
      expect(encoded).toBe('');

      const decoded = decodeBase64URL('');
      expect(decoded).toBe('');
    });
  });

  describe('統合機能テスト', () => {
    it('訪問状態を共有URL用文字列にエンコードする', () => {
      const result = encodeVisitedStateToUrl(sampleVisitedState, samplePavilions);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      // Base64URL文字セットのみを含むことを確認
      expect(result).toMatch(/^[A-Za-z0-9_-]*$/);
    });

    it('共有URL文字列から訪問状態を復元する', () => {
      const encoded = encodeVisitedStateToUrl(sampleVisitedState, samplePavilions);
      const decoded = decodeVisitedStateFromUrl(encoded, samplePavilions);
      expect(decoded).toEqual(sampleVisitedState);
    });

    it('エンコード・デコードの往復でデータが保持される', () => {
      const originalVisited: VisitedState = {
        'jp-001': false,
        'jp-002': true,
        'jp-003': false,
      };

      const encoded = encodeVisitedStateToUrl(originalVisited, samplePavilions);
      const decoded = decodeVisitedStateFromUrl(encoded, samplePavilions);

      expect(decoded).toEqual(originalVisited);
    });

    it('空の訪問状態のエンコード・デコード', () => {
      const emptyVisited: VisitedState = {};
      const encoded = encodeVisitedStateToUrl(emptyVisited, []);
      const decoded = decodeVisitedStateFromUrl(encoded, []);
      expect(decoded).toEqual(emptyVisited);
    });

    it('不正なエンコードされた文字列のエラーハンドリング', () => {
      const invalidEncoded = 'invalid+base64/string=';
      expect(() => {
        decodeVisitedStateFromUrl(invalidEncoded, samplePavilions);
      }).toThrow();
    });
  });

  describe('エッジケース', () => {
    it('パビリオンリストが空の場合', () => {
      const emptyVisited: VisitedState = {};
      const encoded = encodeVisitedStateToUrl(emptyVisited, []);
      expect(encoded).toBe('');

      const decoded = decodeVisitedStateFromUrl('', []);
      expect(decoded).toEqual({});
    });

    it('単一パビリオンの場合', () => {
      const singlePavilion: Pavilion[] = [{
        id: 'single-001',
        name: 'シングルパビリオン',
        coordinate: { x: 0.5, y: 0.5 },
        hitboxRadius: null,
      }];

      const visitedTrue: VisitedState = { 'single-001': true };
      const encodedTrue = encodeVisitedStateToUrl(visitedTrue, singlePavilion);
      const decodedTrue = decodeVisitedStateFromUrl(encodedTrue, singlePavilion);
      expect(decodedTrue).toEqual(visitedTrue);

      const visitedFalse: VisitedState = { 'single-001': false };
      const encodedFalse = encodeVisitedStateToUrl(visitedFalse, singlePavilion);
      const decodedFalse = decodeVisitedStateFromUrl(encodedFalse, singlePavilion);
      expect(decodedFalse).toEqual(visitedFalse);
    });

    it('多数のパビリオン（32個）での処理', () => {
      const manyPavilions: Pavilion[] = Array.from({ length: 32 }, (_, i) => ({
        id: `pavilion-${String(i).padStart(3, '0')}`,
        name: `パビリオン${i}`,
        coordinate: { x: Math.random(), y: Math.random() },
        hitboxRadius: null,
      }));

      const visitedState: VisitedState = {};
      manyPavilions.forEach((p, i) => {
        visitedState[p.id] = i % 3 === 0; // 1/3を訪問済みとする
      });

      const encoded = encodeVisitedStateToUrl(visitedState, manyPavilions);
      const decoded = decodeVisitedStateFromUrl(encoded, manyPavilions);
      expect(decoded).toEqual(visitedState);
    });
  });
});