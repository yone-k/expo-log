import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DevPavilionEditor } from '../components/DevPavilionEditor';
import type { DevPavilion } from '../types/devPavilion';
import * as jsonWriter from '../utils/jsonWriter';
import * as jsonLoader from '../utils/jsonLoader';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

// モックデータ
const mockInputPavilions: DevPavilion[] = [
  {
    id: 'jp-001',
    name: '日本館',
    coordinate: null,
    hitboxRadius: null
  },
  {
    id: 'us-002',
    name: 'アメリカ館',
    coordinate: { x: 0.5, y: 0.5 },
    hitboxRadius: 0.03
  }
];

// モジュールをモック
vi.mock('../utils/jsonWriter', () => ({
  saveToServer: vi.fn(),
  prepareOutputData: vi.fn((data: unknown) => data)
}));

vi.mock('../utils/jsonLoader', () => ({
  loadInputPavilions: vi.fn(),
  convertToDevPavilions: vi.fn((data: unknown) => data)
}));

describe('DevPavilionEditor', () => {
  const mockedSaveToServer = vi.mocked(jsonWriter.saveToServer);
  const mockedLoadInputPavilions = vi.mocked(jsonLoader.loadInputPavilions);

  beforeEach(async () => {
    mockedSaveToServer.mockReset();
    mockedLoadInputPavilions.mockReset();
    mockedLoadInputPavilions.mockResolvedValue(mockInputPavilions);

    const existingPavilions = mockInputPavilions
      .filter((item) => item.coordinate !== null)
      .map((item) => ({
        id: item.id,
        name: item.name,
        coordinate: item.coordinate,
        hitboxRadius: item.hitboxRadius
      }));

    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string | URL) => {
      if (typeof url === 'string' && url.endsWith('pavilions.input.json')) {
        return {
          ok: true,
          json: async () => mockInputPavilions
        } as Response;
      }

      if (typeof url === 'string' && url.endsWith('pavilions.json')) {
        return {
          ok: true,
          json: async () => existingPavilions
        } as Response;
      }

      return {
        ok: false,
        json: async () => ({})
      } as Response;
    });
  });

  it('初期ロード時にパビリオン一覧を表示する', async () => {
    render(<DevPavilionEditor />);

    // ローディング後にパビリオンが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('日本館')).toBeInTheDocument();
      expect(screen.getByText('アメリカ館')).toBeInTheDocument();
    });
  });

  it('パビリオンを選択できる', async () => {
    render(<DevPavilionEditor />);

    await waitFor(() => {
      const japanPavilion = screen.getByText('日本館');
      fireEvent.click(japanPavilion);
    });

    // 選択状態の表示を確認
    expect(screen.getByText('選択中: 日本館')).toBeInTheDocument();
  });

  it('未設定のパビリオンに「座標: 未設定」表示がある', async () => {
    render(<DevPavilionEditor />);

    await waitFor(() => {
      // 日本館は座標未設定なので「座標: 未設定」と表示される
      expect(screen.getByText('座標: 未設定')).toBeInTheDocument();
    });
  });

  it('設定済みのパビリオンに座標情報が表示される', async () => {
    render(<DevPavilionEditor />);

    await waitFor(() => {
      // アメリカ館は座標設定済みなので座標と半径が表示される
      expect(screen.getByText('座標: (0.50, 0.50)')).toBeInTheDocument();
      expect(screen.getByText('半径: 0.030')).toBeInTheDocument();
    });
  });

  it('マップクリック時に座標が設定される', async () => {
    render(<DevPavilionEditor />);

    await waitFor(() => {
      // パビリオン選択
      const japanPavilion = screen.getByText('日本館');
      fireEvent.click(japanPavilion);
    });

    // マップキャンバスをクリック（1回目：中心設定）
    const mapCanvas = screen.getByTestId('dev-map-canvas');
    fireEvent.click(mapCanvas, { clientX: 400, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByText('中心: (0.50, 0.50)')).toBeInTheDocument();
    });

    // 2回目のクリック（半径設定）
    fireEvent.click(mapCanvas, { clientX: 500, clientY: 300 });

    await waitFor(() => {
      expect(screen.getAllByText('半径: 0.125').length).toBeGreaterThan(0);
    });
  });

  it('保存成功時に成功メッセージを表示する', async () => {
    mockedSaveToServer.mockResolvedValue({ success: true });

    render(<DevPavilionEditor />);

    await waitFor(() => {
      // 座標設定完了後、保存が自動実行される
      const japanPavilion = screen.getByText('日本館');
      fireEvent.click(japanPavilion);
    });

    const mapCanvas = screen.getByTestId('dev-map-canvas');
    fireEvent.click(mapCanvas, { clientX: 400, clientY: 300 });
    fireEvent.click(mapCanvas, { clientX: 500, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByText('保存成功')).toBeInTheDocument();
    });
  });

  it('保存失敗時にエラーメッセージを表示する', async () => {
    mockedSaveToServer.mockResolvedValue({
      success: false,
      error: 'サーバーエラー'
    });

    render(<DevPavilionEditor />);

    await waitFor(() => {
      const japanPavilion = screen.getByText('日本館');
      fireEvent.click(japanPavilion);
    });

    const mapCanvas = screen.getByTestId('dev-map-canvas');
    fireEvent.click(mapCanvas, { clientX: 400, clientY: 300 });
    fireEvent.click(mapCanvas, { clientX: 500, clientY: 300 });

    await waitFor(() => {
      expect(screen.getByText('保存失敗: サーバーエラー')).toBeInTheDocument();
    });
  });

  it('検索機能でパビリオンをフィルタリングできる', async () => {
    render(<DevPavilionEditor />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('パビリオンを検索...');
      fireEvent.change(searchInput, { target: { value: '日本' } });
    });

    await waitFor(() => {
      expect(screen.getByText('日本館')).toBeInTheDocument();
      expect(screen.queryByText('アメリカ館')).not.toBeInTheDocument();
    });
  });
});
