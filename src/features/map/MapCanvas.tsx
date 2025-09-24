import { useCallback, useMemo } from 'react'
import { useVisitedState } from '../../hooks/useVisitedState'
import {
  findHitPavilion,
  scaleCoordinate,
  type MapSize,
} from '../../utils/hitbox'

export type MapCanvasProps = {
  /** マップ画像のパス */
  mapSrc?: string
  /** マップの表示幅 */
  width?: number
  /** マップの表示高さ */
  height?: number
  /** 追加クラス */
  className?: string
}

const DEFAULT_MAP_SRC = '/assets/map.png'
const MAP_ALT_TEXT = '大阪・関西万博マップ'

function MapCanvas({
  mapSrc = DEFAULT_MAP_SRC,
  width = 800,
  height = 600,
  className,
}: MapCanvasProps) {
  const {
    visitedState,
    toggleVisited,
    isEditMode,
    pavilions,
    defaultHitboxRadius,
  } = useVisitedState()

  const mapSize: MapSize = useMemo(
    () => ({ width, height }),
    [width, height],
  )

    const visitedPavilions = useMemo(
    () => pavilions.filter(pavilion => Boolean(visitedState[pavilion.id])),
    [pavilions, visitedState],
  )

  const handleMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditMode) {
        return
      }

      const rect = event.currentTarget.getBoundingClientRect()
      const clickPoint = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }

      const hitPavilion = findHitPavilion(clickPoint, {
        pavilions,
        mapSize,
        defaultRadius: defaultHitboxRadius,
      })

      if (hitPavilion) {
        toggleVisited(hitPavilion.id)
      }
    },
    [isEditMode, pavilions, mapSize, defaultHitboxRadius, toggleVisited],
  )

  return (
    <div
      data-testid="map-canvas"
      className={className}
      role="presentation"
      onClick={handleMapClick}
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        cursor: isEditMode ? 'pointer' : 'default',
      }}
    >
      <img
        src={mapSrc}
        alt={MAP_ALT_TEXT}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {visitedPavilions.map(pavilion => {
        const pixel = scaleCoordinate(pavilion.coordinate, mapSize)

        return (
          <img
            key={pavilion.id}
            src="/assets/pin.svg"
            alt={`${pavilion.name}の訪問済みピン`}
            style={{
              position: 'absolute',
              left: `${pixel.x}px`,
              top: `${pixel.y}px`,
              transform: 'translate(-50%, -100%)',
              width: '24px',
              height: '24px',
              pointerEvents: 'none',
            }}
          />
        )
      })}
    </div>
  )
}

export default MapCanvas
