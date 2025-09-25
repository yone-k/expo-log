import { describe, it, expect } from 'vitest';
import { loadInputPavilions, convertToDevPavilions, InputPavilionData } from '../utils/jsonLoader';

describe('JSON読み込み・変換ロジック', () => {
  describe('loadInputPavilions', () => {
    it('有効な入力JSONを読み込める', async () => {
      const inputData: InputPavilionData[] = [
        { id: 'test-001', name: 'テスト館A' },
        { id: 'test-002', name: 'テスト館B' }
      ];

      // モックデータを使用したテスト
      const result = await loadInputPavilions('/mock/path', inputData);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test-001');
      expect(result[0].name).toBe('テスト館A');
    });

    it('空の配列でも正常に処理する', async () => {
      const result = await loadInputPavilions('/mock/path', []);
      expect(result).toHaveLength(0);
    });

    it('不正な形式のJSONでエラーを投げる', async () => {
      const invalidData = [
        { id: 'test-001' },
        { name: 'テスト館B' }
      ] as unknown;

      await expect(loadInputPavilions('/mock/path', invalidData)).rejects.toThrow();
    });
  });

  describe('convertToDevPavilions', () => {
    it('InputPavilionDataをDevPavilionに変換する', () => {
      const input: InputPavilionData[] = [
        { id: 'jp-001', name: '日本館' },
        { id: 'us-002', name: 'アメリカ館' }
      ];

      const result = convertToDevPavilions(input);

      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        id: 'jp-001',
        name: '日本館',
        coordinate: null,
        hitboxRadius: null
      });

      expect(result[1]).toEqual({
        id: 'us-002',
        name: 'アメリカ館',
        coordinate: null,
        hitboxRadius: null
      });
    });

    it('空の配列を正しく処理する', () => {
      const result = convertToDevPavilions([]);
      expect(result).toHaveLength(0);
    });

    it('重複するIDが含まれる場合エラーを投げる', () => {
      const input: InputPavilionData[] = [
        { id: 'duplicate', name: '館A' },
        { id: 'duplicate', name: '館B' }
      ];

      expect(() => convertToDevPavilions(input)).toThrow('重複するID');
    });

    it('空のIDまたは名前が含まれる場合エラーを投げる', () => {
      const input: InputPavilionData[] = [
        { id: '', name: '館A' }
      ];

      expect(() => convertToDevPavilions(input)).toThrow();
    });
  });
});
