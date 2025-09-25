import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveToServer, prepareOutputData } from '../utils/jsonWriter';
import type { DevPavilion } from '../types/devPavilion';
import type { Pavilion } from '../types/pavilion';

// fetchのモック
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe('JSON書き込みロジック', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('prepareOutputData', () => {
    const sampleDevPavilions: DevPavilion[] = [
      {
        id: 'test-001',
        name: 'テスト館A',
        coordinate: { x: 0.5, y: 0.5 },
        hitboxRadius: 0.03
      },
      {
        id: 'test-002',
        name: 'テスト館B',
        coordinate: null,
        hitboxRadius: null
      },
      {
        id: 'test-003',
        name: 'テスト館C',
        coordinate: { x: 0.3, y: 0.7 },
        hitboxRadius: null
      }
    ];

    it('DevPavilionからPavilion形式に変換する', () => {
      const first = prepareOutputData(sampleDevPavilions[0]);
      expect(first).toEqual({
        id: 'test-001',
        name: 'テスト館A',
        coordinate: { x: 0.5, y: 0.5 },
        hitboxRadius: 0.03
      });
    });

    it('座標未設定の場合はエラーを投げる', () => {
      const target: DevPavilion = {
        id: 'test-999',
        name: '未設定館',
        coordinate: null,
        hitboxRadius: null
      };

      expect(() => prepareOutputData(target)).toThrow('座標が設定されていません');
    });
  });

  describe('saveToServer', () => {
    const samplePavilions: Pavilion[] = [
      {
        id: 'test-001',
        name: 'テスト館A',
        coordinate: { x: 0.5, y: 0.5 },
        hitboxRadius: 0.03
      }
    ];

    it('成功時にsuccessレスポンスを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await saveToServer(samplePavilions[0]);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/__dev/api/pavilions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(samplePavilions[0])
      });
    });

    it('失敗時にエラーメッセージを含むレスポンスを返す', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' })
      });

      const result = await saveToServer(samplePavilions[0]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('ネットワークエラー時にエラーレスポンスを返す', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await saveToServer(samplePavilions[0]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('単一要素でも正常に送信する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await saveToServer(samplePavilions[0]);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/__dev/api/pavilions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(samplePavilions[0])
      });
    });
  });
});
