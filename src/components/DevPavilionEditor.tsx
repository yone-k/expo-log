import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import type { MouseEvent } from 'react';
import { DevPavilion } from '../types/devPavilion';
import { CoordinateSetter, CoordinateSetterState } from '../utils/coordinateSetter';
import { loadInputPavilions, convertToDevPavilions } from '../utils/jsonLoader';
import { saveToServer, prepareOutputData } from '../utils/jsonWriter';
import type { MapSize } from '../utils/hitbox';
import type { Pavilion } from '../types/pavilion';

const MAP_SIZE: MapSize = { width: 800, height: 600 };
const BASE_URL = import.meta.env.BASE_URL;
const MAP_IMAGE_SRC = `${BASE_URL}assets/map.png`;
const INPUT_JSON_URL = `${BASE_URL}data/pavilions.input.json`;
const OUTPUT_JSON_URL = `${BASE_URL}data/pavilions.json`;

/**
 * 通知の種類
 */
type NotificationType = 'success' | 'error' | 'info';

/**
 * 通知メッセージ
 */
type Notification = {
  type: NotificationType;
  message: string;
};

/**
 * 開発専用パビリオン編集コンポーネント
 * 設計書に従った機能を提供
 */
export function DevPavilionEditor() {
  // 状態管理
  const [pavilions, setPavilions] = useState<DevPavilion[]>([]);
  const [filteredPavilions, setFilteredPavilions] = useState<DevPavilion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [coordinateSetter, setCoordinateSetter] = useState<CoordinateSetter | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedPavilion, setLastSavedPavilion] = useState<DevPavilion | null>(null);

  // 検索フィルタリング
  useEffect(() => {
    const filtered = pavilions.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPavilions(filtered);
  }, [pavilions, searchTerm]);

  /**
   * 初期データの読み込み
   */
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);

      // pavilions.input.json を fetch で読み込み
      let inputData;
      try {
        const response = await fetch(INPUT_JSON_URL);
        const jsonData = await response.json();
        inputData = await loadInputPavilions(INPUT_JSON_URL, jsonData);
      } catch {
        // フォールバック: テスト環境や開発初期のデフォルトデータ
        inputData = await loadInputPavilions('/mock/path', [
          { id: 'jp-001', name: '日本館' },
          { id: 'us-002', name: 'アメリカ館' }
        ]);
      }

      const existingPavilions = await fetchExistingPavilions();
      const existingMap = new Map(existingPavilions.map((item) => [item.id, item]));

      const devPavilions = convertToDevPavilions(inputData).map((pavilion) => {
        const existing = existingMap.get(pavilion.id);
        if (!existing) {
          return pavilion;
        }
        return {
          ...pavilion,
          coordinate: existing.coordinate ?? null,
          hitboxRadius: existing.hitboxRadius ?? null
        };
      });

      setPavilions(devPavilions);
      setCoordinateSetter(new CoordinateSetter(devPavilions, MAP_SIZE));

      setNotification({ type: 'success', message: `${devPavilions.length}件のパビリオンを読み込みました` });
    } catch (error) {
      setNotification({
        type: 'error',
        message: `データ読み込みエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初期ロード
  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  /**
   * パビリオン選択処理
   */
  const handlePavilionSelect = (id: string) => {
    try {
      if (!coordinateSetter) return;

      setLastSavedPavilion(null);
      const result = coordinateSetter.selectPavilion(id);
      if (result.cancelledPending || coordinateSetter.getState() === CoordinateSetterState.Selected) {
        setPavilions([...coordinateSetter.getPavilions()]);
      }
      setNotification(null); // 通知をクリア
    } catch (error) {
      setNotification({
        type: 'error',
        message: `選択エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  /**
   * マップクリック処理
   */
  const handleMapClick = async (event: MouseEvent<HTMLDivElement>) => {
    if (!coordinateSetter) return;

    try {
      const rect = event.currentTarget.getBoundingClientRect();
      const width = rect.width || MAP_SIZE.width;
      const height = rect.height || MAP_SIZE.height;

      const normalizedPoint = {
        x: Math.min(Math.max((event.clientX - rect.left) / width, 0), 1),
        y: Math.min(Math.max((event.clientY - rect.top) / height, 0), 1)
      };

      const mappedPoint = {
        x: normalizedPoint.x * MAP_SIZE.width,
        y: normalizedPoint.y * MAP_SIZE.height
      };

      const result = coordinateSetter.handleMapClick(mappedPoint);

      const updatedPavilions = coordinateSetter.getPavilions();
      setPavilions([...updatedPavilions]);

      if (result && result.completed) {
        const target = updatedPavilions.find((pavilion) => pavilion.id === result.id);
        if (target) {
          setLastSavedPavilion(target);
          await saveChanges(target);
        }
      }

    } catch (error) {
      setNotification({
        type: 'error',
        message: `座標設定エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  /**
   * 変更をサーバーに保存
   */
  const saveChanges = async (pavilion: DevPavilion) => {
    try {
      const outputData = prepareOutputData(pavilion);
      const result = await saveToServer(outputData);

      if (result.success) {
        setNotification({ type: 'success', message: '保存成功' });
        setLastSavedPavilion(pavilion);
      } else {
        setNotification({ type: 'error', message: `保存失敗: ${result.error}` });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: `保存エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  /**
   * 座標表示のフォーマット
   */
  const formatCoordinate = (coordinate: { x: number; y: number } | null): string => {
    if (!coordinate) return '未設定';
    if (!Number.isFinite(coordinate.x) || !Number.isFinite(coordinate.y)) {
      return '未設定';
    }
    return `(${coordinate.x.toFixed(2)}, ${coordinate.y.toFixed(2)})`;
  };

  // ローディング表示
  if (isLoading) {
    return <div>データを読み込み中...</div>;
  }

  const selectedPavilion = coordinateSetter?.getSelectedPavilion();
  const setterState = coordinateSetter?.getState();
  const summaryPavilion = selectedPavilion ?? lastSavedPavilion;

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: '#f4f6f8',
        padding: 32
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
          flexWrap: 'wrap'
        }}
      >
        <div
          style={{
            flex: '2 1 640px',
            minWidth: 400,
            background: '#ffffff',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: 16
          }}
        >
          <MapDisplay
            state={setterState ?? CoordinateSetterState.Idle}
            selected={selectedPavilion ?? null}
            completed={lastSavedPavilion}
            onClick={handleMapClick}
          />
        </div>

        <aside
          style={{
            flex: '1 1 320px',
            minWidth: 280,
            maxWidth: 420,
            background: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            borderRadius: 12,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            maxHeight: '80vh'
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>パビリオン一覧</h2>

          <input
            type="text"
            placeholder="パビリオンを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 6,
              border: '1px solid #cfd8dc'
            }}
          />

          {selectedPavilion && (
            <div
              style={{
                background: '#e3f2fd',
                padding: '10px',
                borderRadius: 8
              }}
            >
              <div style={{ fontWeight: 'bold' }}>選択中: {selectedPavilion.name}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                座標: {formatCoordinate(selectedPavilion.coordinate)} / 半径: {selectedPavilion.hitboxRadius?.toFixed(3) || '未設定'}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
            {filteredPavilions.map(pavilion => (
              <div
                key={pavilion.id}
                onClick={() => handlePavilionSelect(pavilion.id)}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: 8,
                  border: selectedPavilion?.id === pavilion.id ? '1px solid #1976d2' : '1px solid #CFD8DC',
                  background: selectedPavilion?.id === pavilion.id ? '#bbdefb' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{pavilion.name}</div>
                <div style={{ fontSize: 12, color: '#607d8b' }}>ID: {pavilion.id}</div>
                <div style={{ fontSize: 12 }}>座標: {formatCoordinate(pavilion.coordinate)}</div>
                {pavilion.hitboxRadius !== null && (
                  <div style={{ fontSize: 12 }}>半径: {pavilion.hitboxRadius.toFixed(3)}</div>
                )}
              </div>
            ))}
          </div>

          {summaryPavilion && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: '#f1f8ff',
                border: '1px solid #bbdefb'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>中心: {formatCoordinate(summaryPavilion.coordinate)}</div>
              <div style={{ fontSize: 12 }}>半径: {summaryPavilion.hitboxRadius?.toFixed(3) || '未設定'}</div>
            </div>
          )}

          {notification && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: notification.type === 'error' ? '#f44336' : notification.type === 'info' ? '#1976d2' : '#4caf50',
                background: notification.type === 'error' ? '#ffebee' : notification.type === 'info' ? '#e3f2fd' : '#e8f5e9',
                color: notification.type === 'error' ? '#c62828' : notification.type === 'info' ? '#0d47a1' : '#2e7d32'
              }}
            >
              {notification.message}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

type MapDisplayProps = {
  state: CoordinateSetterState;
  selected: DevPavilion | null;
  completed: DevPavilion | null;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
};

function MapDisplay({ state, selected, completed, onClick }: MapDisplayProps) {
  const DEFAULT_ASPECT_RATIO = 2560 / 1440;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(DEFAULT_ASPECT_RATIO);
  const [containerSize, setContainerSize] = useState<MapSize>({
    width: MAP_SIZE.width,
    height: MAP_SIZE.height
  });

  const updateSize = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useLayoutEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    updateSize();
  }, [aspectRatio, updateSize]);

  let displaySource: DevPavilion | null = null;
  let hideRadius = false;

  if (selected) {
    displaySource = selected;
    hideRadius = state === CoordinateSetterState.CenterPending;
  } else if (completed) {
    displaySource = completed;
    hideRadius = false;
  }

  const center = displaySource?.coordinate ?? null;
  const centerX = center ? center.x * containerSize.width : null;
  const centerY = center ? center.y * containerSize.height : null;
  const radiusSource = hideRadius ? null : displaySource?.hitboxRadius ?? null;
  const radiusPx = radiusSource ? radiusSource * containerSize.width : null;

  const paddingTop = `${(1 / aspectRatio) * 100}%`;

  return (
    <div
      ref={containerRef}
      data-testid="dev-map-canvas"
      role="presentation"
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop,
        border: '1px solid #ccc',
        cursor: state === CoordinateSetterState.Idle ? 'default' : 'crosshair',
        overflow: 'hidden'
      }}
    >
      <img
        src={MAP_IMAGE_SRC}
        alt="大阪・関西万博マップ (開発用)"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            const ratio = naturalWidth / naturalHeight;
            setAspectRatio(ratio);
          }
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          pointerEvents: 'none'
        }}
      />

      {centerX !== null && centerY !== null && (
        <div
          style={{
            position: 'absolute',
            left: centerX - 6,
            top: centerY - 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#1976d2',
            border: '2px solid #fff',
            boxShadow: '0 0 4px rgba(0,0,0,0.4)',
            pointerEvents: 'none'
          }}
        />
      )}

      {centerX !== null && centerY !== null && radiusPx !== null && radiusPx > 0 && (
        <div
          style={{
            position: 'absolute',
            left: centerX - radiusPx,
            top: centerY - radiusPx,
            width: radiusPx * 2,
            height: radiusPx * 2,
            border: '1px dashed #1976d2',
            borderRadius: '50%',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}

async function fetchExistingPavilions(): Promise<Pavilion[]> {
  try {
    const response = await fetch(OUTPUT_JSON_URL);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as Pavilion[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
