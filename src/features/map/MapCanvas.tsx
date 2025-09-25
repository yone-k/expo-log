import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useVisitedState } from '../../hooks/useVisitedState'
import {
  findHitPavilion,
  scaleCoordinate,
  type MapSize,
} from '../../utils/hitbox'
import * as React from "react";

export type MapCanvasProps = {
  /** マップ画像のパス */
  mapSrc?: string
  /** 追加クラス */
  className?: string
  /** ルート要素のid */
  id?: string
}

const DEFAULT_MAP_SRC = `${import.meta.env.BASE_URL}assets/map.png`
const PIN_ICON_SRC = `${import.meta.env.BASE_URL}assets/pin.svg`
const MAP_ALT_TEXT = '大阪・関西万博マップ'
const DEFAULT_MAP_WIDTH = 2560
const DEFAULT_MAP_HEIGHT = 1440
const PIN_BASE_SIZE = 64
const PIN_MIN_SIZE = 12

function MapCanvas({ mapSrc = DEFAULT_MAP_SRC, className, id }: MapCanvasProps) {
  const {
    visitedState,
    toggleVisited,
    isEditMode,
    pavilions,
    defaultHitboxRadius,
  } = useVisitedState()

  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const [mapSize, setMapSize] = useState<MapSize>({
    width: DEFAULT_MAP_WIDTH,
    height: DEFAULT_MAP_HEIGHT,
  })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const pinSize = useMemo(() => {
    const scale = mapSize.width / DEFAULT_MAP_WIDTH
    const computedSize = PIN_BASE_SIZE * scale
    return Number.isFinite(computedSize)
      ? Math.max(computedSize, PIN_MIN_SIZE)
      : PIN_BASE_SIZE
  }, [mapSize.width])

  const updateSize = useCallback(() => {
    const element = containerRef.current
    if (!element) return
    const rect = element.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setMapSize({ width: rect.width, height: rect.height })
    }
  }, [])

  useLayoutEffect(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => {
      window.removeEventListener('resize', updateSize)
    }
  }, [updateSize])

  const visitedPavilions = useMemo(
    () => pavilions.filter(pavilion => Boolean(visitedState[pavilion.id])),
    [pavilions, visitedState],
  )

  const handlePointerPosition = useCallback(
    (clientX: number, clientY: number) => {
      const element = containerRef.current
      if (!element) return null

      const rect = element.getBoundingClientRect()
      const clickPoint = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }

      const localSize = { width: rect.width, height: rect.height }

      return findHitPavilion(clickPoint, {
        pavilions,
        mapSize: localSize,
        defaultRadius: defaultHitboxRadius,
      })
    },
    [defaultHitboxRadius, pavilions],
  )

  const handleMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditMode) {
        return
      }

      const hitPavilion = handlePointerPosition(event.clientX, event.clientY)

      if (hitPavilion) {
        toggleVisited(hitPavilion.id)
      }
    },
    [handlePointerPosition, isEditMode, toggleVisited],
  )

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditMode) {
        setHoveredId(null)
        return
      }
      const hitPavilion = handlePointerPosition(event.clientX, event.clientY)
      setHoveredId(hitPavilion?.id ?? null)
    },
    [handlePointerPosition, isEditMode],
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
  }, [])

  const aspectPadding = `${(DEFAULT_MAP_HEIGHT / DEFAULT_MAP_WIDTH) * 100}%`

  return (
    <div
      ref={containerRef}
      data-testid="map-canvas"
      id={id}
      className={className}
      role="presentation"
      onClick={handleMapClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: aspectPadding,
        cursor: isEditMode && hoveredId ? 'pointer' : 'default',
      }}
    >
      <img
        ref={imageRef}
        src={mapSrc}
        alt={MAP_ALT_TEXT}
        onLoad={updateSize}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />

      {visitedPavilions.map(pavilion => {
        const pixel = scaleCoordinate(pavilion.coordinate, mapSize)

        return (
          <img
            key={pavilion.id}
            src={PIN_ICON_SRC}
            alt={`${pavilion.name}の訪問済みピン`}
            style={{
              position: 'absolute',
              left: `${pixel.x}px`,
              top: `${pixel.y}px`,
              transform: 'translate(-50%, -100%)',
              width: `${pinSize}px`,
              height: `${pinSize}px`,
              pointerEvents: 'none',
            }}
          />
        )
      })}
    </div>
  )
}

export default MapCanvas
