import { describe, it, expect } from 'vitest';
import { CoordinateSetter, CoordinateSetterState } from '../utils/coordinateSetter';
import { DevPavilion } from '../types/devPavilion';
import { MapSize, PixelCoordinate } from '../utils/hitbox';

describe('座標設定・半径計算ロジック', () => {
  const mapSize: MapSize = { width: 800, height: 600 };

  const samplePavilions: DevPavilion[] = [
    {
      id: 'test-001',
      name: 'テスト館A',
      coordinate: null,
      hitboxRadius: null
    },
    {
      id: 'test-002',
      name: 'テスト館B',
      coordinate: { x: 0.5, y: 0.5 },
      hitboxRadius: 0.03
    }
  ];

  describe('CoordinateSetter', () => {
    it('初期状態ではidle状態である', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      expect(setter.getState()).toBe(CoordinateSetterState.Idle);
      expect(setter.getSelectedPavilion()).toBeNull();
    });

    it('パビリオンを選択できる', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');

      expect(setter.getState()).toBe(CoordinateSetterState.Selected);
      expect(setter.getSelectedPavilion()?.id).toBe('test-001');
    });

    it('存在しないIDを選択した場合エラーを投げる', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      expect(() => setter.selectPavilion('invalid-id')).toThrow('存在しないパビリオンID');
    });

    it('1回目のクリックで中心座標を設定する', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');

      const clickPoint: PixelCoordinate = { x: 400, y: 300 };
      const result = setter.handleMapClick(clickPoint);

      expect(setter.getState()).toBe(CoordinateSetterState.CenterPending);
      expect(result.coordinate).toEqual({ x: 0.5, y: 0.5 });
      expect(result.hitboxRadius).toBeNull();
    });

    it('2回目のクリックで半径を計算し完了状態になる', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');

      // 1回目のクリック（中心設定）
      setter.handleMapClick({ x: 400, y: 300 });

      // 2回目のクリック（半径設定）
      const secondClick: PixelCoordinate = { x: 600, y: 300 };
      const result = setter.handleMapClick(secondClick);

      expect(setter.getState()).toBe(CoordinateSetterState.Idle);
      expect(result.coordinate).toEqual({ x: 0.5, y: 0.5 });
      expect(result.hitboxRadius).toBe(0.25); // 200px / 800px = 0.25
    });

    it('2回目のクリック後は完了状態になり新規選択が必要', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');

      // 1回目・2回目のクリック
      setter.handleMapClick({ x: 400, y: 300 });
      setter.handleMapClick({ x: 600, y: 300 });

      // 完了状態になっている
      expect(setter.getState()).toBe(CoordinateSetterState.Idle);
      expect(setter.getSelectedPavilion()).toBeNull();

      // 3回目のクリック（未選択状態）はエラー
      expect(() => setter.handleMapClick({ x: 100, y: 100 })).toThrow('パビリオンが選択されていません');
    });

    it('別のパビリオンを選択すると状態がリセットされる', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');
      setter.handleMapClick({ x: 400, y: 300 });

      expect(setter.getState()).toBe(CoordinateSetterState.CenterPending);

      // 別のパビリオンを選択
      setter.selectPavilion('test-002');

      expect(setter.getState()).toBe(CoordinateSetterState.Selected);
      expect(setter.getSelectedPavilion()?.id).toBe('test-002');
    });

    it('中心設定中に別のパビリオンを選択すると前回の未確定値を破棄する', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');

      // 1回目のクリックで一時的に座標が設定される
      setter.handleMapClick({ x: 400, y: 300 });
      const pendingBefore = setter.getPavilions().find(p => p.id === 'test-001');
      expect(pendingBefore?.coordinate).toEqual({ x: 0.5, y: 0.5 });

      // 別のパビリオンへ切り替え
      const result = setter.selectPavilion('test-002');

      expect(setter.getSelectedPavilion()?.id).toBe('test-002');
      expect(setter.getState()).toBe(CoordinateSetterState.Selected);
      expect(result.cancelledPending).toBe(true);
    });

    it('未選択状態でクリックした場合エラーを投げる', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      expect(() => setter.handleMapClick({ x: 400, y: 300 })).toThrow('パビリオンが選択されていません');
    });

    it('座標が更新された配列を返す', () => {
      const setter = new CoordinateSetter(samplePavilions, mapSize);
      setter.selectPavilion('test-001');

      // 完了まで実行
      setter.handleMapClick({ x: 400, y: 300 });
      setter.handleMapClick({ x: 600, y: 300 });

      const updated = setter.getPavilions();
      const targetPavilion = updated.find(p => p.id === 'test-001');

      expect(targetPavilion?.coordinate).toEqual({ x: 0.5, y: 0.5 });
      expect(targetPavilion?.hitboxRadius).toBe(0.25);
    });
  });
});
