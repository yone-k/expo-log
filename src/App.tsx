import { useEffect, useMemo, useState } from 'react'
import MapCanvas from './features/map/MapCanvas'
import PavilionList from './features/list/PavilionList'
import ShareControls from './components/ShareControls'
import DownloadButton from './components/DownloadButton'
import { VisitedStateProvider } from './context/VisitedStateProvider'
import type { Pavilion } from './types/pavilion'
import './App.css'

const DATA_URL = `${import.meta.env.BASE_URL}data/pavilions.json`
const DEFAULT_RADIUS = 0.01
const MAP_ELEMENT_ID = 'expo-map'

type FetchState = 'loading' | 'error' | 'ready'

function parseMode(searchParams: URLSearchParams): 'edit' | 'readonly' {
   const mode = searchParams.get('mode')
   if (!mode) return 'edit'
   return mode === 'readonly' ? 'readonly' : 'edit'
 }
 
function parseVisited(searchParams: URLSearchParams): string {
   return searchParams.get('visited') ?? ''
 }
 
function App() {
   const [pavilions, setPavilions] = useState<Pavilion[]>([])
   const [status, setStatus] = useState<FetchState>('loading')
   const [errorMessage, setErrorMessage] = useState('')

   const homeUrl = import.meta.env.BASE_URL || '/'
   const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
   const initialMode = useMemo(() => parseMode(searchParams), [searchParams])
   const initialVisited = useMemo(() => parseVisited(searchParams), [searchParams])
 
   const fetchPavilions = async () => {
     setStatus('loading')
     setErrorMessage('')
 
     try {
       const response = await fetch(DATA_URL)
       if (!response.ok) {
         throw new Error(`HTTP ${response.status}`)
       }
       const data = (await response.json()) as Pavilion[]
       setPavilions(data)
       setStatus('ready')
     } catch (error) {
       console.error('Failed to load pavilion data', error)
       setErrorMessage('データの読み込みに失敗しました。再試行してください。')
       setStatus('error')
     }
   }
 
  useEffect(() => {
    fetchPavilions()
  }, [])
 
   if (status === 'loading') {
     return (
       <div className="app-status" role="status" data-testid="loading-state">
         読み込み中...
       </div>
     )
   }
 
   if (status === 'error') {
     return (
       <div className="app-status" role="alert" data-testid="error-state">
         <p>{errorMessage}</p>
         <button onClick={fetchPavilions}>再試行</button>
       </div>
     )
   }
 
   return (
     <VisitedStateProvider
       initialMode={initialMode}
       initialVisited={initialVisited}
       pavilions={pavilions}
       defaultHitboxRadius={DEFAULT_RADIUS}
     >
       <main className="app-layout">
        <header className="app-header">
          <h1>
            <a href={homeUrl}>EXPO LOG</a>
          </h1>
         </header>
         <section className="app-content">
          <div className="map-column" data-testid="map-column">
            <section className="card map-card" aria-label="マップ">
              <MapCanvas id={MAP_ELEMENT_ID} className="map-canvas" />
            </section>
            <section className="card share-download-card" aria-label="共有とダウンロード">
              <ShareControls />
              <DownloadButton mapSelector={`#${MAP_ELEMENT_ID}`} className="download-button" />
            </section>
          </div>
          <aside className="sidebar">
            <section className="card list-card" aria-label="パビリオン一覧">
              <PavilionList />
            </section>
          </aside>
        </section>
       </main>
     </VisitedStateProvider>
   )
 }
 
 export default App
