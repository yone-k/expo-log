import { DevPavilion } from '../types/devPavilion';
import { MapSize, PixelCoordinate } from './hitbox';
import { pixelToNormalized, calculateNormalizedDistance } from './coordinateUtils';

/**
 * 座標設定器の状態
 */
export enum CoordinateSetterState {
  Idle = 'idle',
  Selected = 'selected',
  CenterPending = 'center-pending',
  RadiusPending = 'radius-pending'
}

/**
 * 座標設定結果
 */
type CoordinateResult = {
  id: string;
  coordinate: { x: number; y: number } | null;
  hitboxRadius: number | null;
  completed: boolean;
};

/**
 * 座標設定・半径計算を管理するクラス
 * 開発ツールでのマップクリック処理を状態管理しながら実行
 */
export class CoordinateSetter {
  private pavilions: DevPavilion[];
  private selectedId: string | null = null;
  private state: CoordinateSetterState = CoordinateSetterState.Idle;
  private centerPoint: PixelCoordinate | null = null;
  private mapSize: MapSize;

  constructor(pavilions: DevPavilion[], mapSize: MapSize) {
    this.pavilions = [...pavilions];
    this.mapSize = mapSize;
  }

  /**
   * 現在の状態を取得する
   */
  getState(): CoordinateSetterState {
    return this.state;
  }

  /**
   * 選択中のパビリオンを取得する
   */
  getSelectedPavilion(): DevPavilion | null {
    if (!this.selectedId) return null;
    return this.pavilions.find(p => p.id === this.selectedId) || null;
  }

  /**
   * 現在のパビリオン配列を取得する
   */
  getPavilions(): DevPavilion[] {
    return [...this.pavilions];
  }

  /**
   * パビリオンを選択する
   * 状態を Selected に変更し、前回の設定をリセット
   */
  selectPavilion(id: string): { cancelledPending: boolean } {
    const pavilion = this.pavilions.find(p => p.id === id);
    if (!pavilion) {
      throw new Error(`存在しないパビリオンID: ${id}`);
    }

    const previousId = this.selectedId;
    const wasCenterPending = this.state === CoordinateSetterState.CenterPending;

    this.selectedId = id;
    this.state = CoordinateSetterState.Selected;
    this.centerPoint = null;

    return {
      cancelledPending: wasCenterPending && previousId !== id
    };
  }

  /**
   * マップクリックを処理する
   * 状態に応じて1回目（中心設定）または2回目（半径設定）の処理を実行
   */
  handleMapClick(clickPoint: PixelCoordinate): CoordinateResult {
    if (this.state === CoordinateSetterState.Idle) {
      throw new Error('パビリオンが選択されていません');
    }

    if (!this.selectedId) {
      throw new Error('パビリオンが選択されていません');
    }

    switch (this.state) {
      case CoordinateSetterState.Selected:
        return this.handleFirstClick(clickPoint);

      case CoordinateSetterState.CenterPending:
        return this.handleSecondClick(clickPoint);

      default:
        // RadiusPending または完了後は何もしない（現在の値を返す）
        return this.getCurrentResult();
    }
  }

  /**
   * 1回目のクリック処理（中心座標設定）
   */
  private handleFirstClick(clickPoint: PixelCoordinate): CoordinateResult {
    this.centerPoint = clickPoint;
    this.state = CoordinateSetterState.CenterPending;

    const coordinate = pixelToNormalized(clickPoint, this.mapSize);

    // パビリオン配列を更新
    this.updatePavilion(coordinate, null);

    return {
      id: this.selectedId!,
      coordinate,
      hitboxRadius: null,
      completed: false
    };
  }

  /**
   * 2回目のクリック処理（半径設定）
   */
  private handleSecondClick(clickPoint: PixelCoordinate): CoordinateResult {
    if (!this.centerPoint) {
      throw new Error('中心座標が設定されていません');
    }

    const pavilionId = this.selectedId!;
    const coordinate = pixelToNormalized(this.centerPoint, this.mapSize);
    const hitboxRadius = calculateNormalizedDistance(
      this.centerPoint,
      clickPoint,
      this.mapSize
    );

    // パビリオン配列を更新
    this.updatePavilion(coordinate, hitboxRadius);

    // 完了状態にリセット
    this.state = CoordinateSetterState.Idle;
    this.selectedId = null;
    this.centerPoint = null;

    return {
      id: pavilionId,
      coordinate,
      hitboxRadius,
      completed: true
    };
  }

  /**
   * 現在の設定値を取得する
   */
  private getCurrentResult(): CoordinateResult {
    const pavilion = this.getSelectedPavilion();
    return {
      id: this.selectedId!,
      coordinate: pavilion?.coordinate || null,
      hitboxRadius: pavilion?.hitboxRadius || null,
      completed: false
    };
  }

  /**
   * パビリオン配列の特定のアイテムを更新する
   */
  private updatePavilion(
    coordinate: { x: number; y: number },
    hitboxRadius: number | null
  ): void {
    this.pavilions = this.pavilions.map(p =>
      p.id === this.selectedId
        ? { ...p, coordinate, hitboxRadius }
        : p
    );
  }

}
