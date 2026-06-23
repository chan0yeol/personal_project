import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import MapPage from './pages/MapPage'
import FavoritesPage from './pages/FavoritesPage'
import EventPage from './pages/EventPage'
import MyPage from './pages/MyPage'
import AdminPage from './pages/AdminPage'
import GatheringsPage from './pages/GatheringsPage'
import VideosPage from './pages/VideosPage'
import './index.css'

function AppInner() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('map')
  // 마이페이지에서 지도로 이동할 때 목표 스팟 { id, lat, lng }
  const [mapTarget, setMapTarget] = useState(null)

  // 특정 스팟으로 지도 이동 - 탭 전환 + 위치/패널 설정
  const navigateToSpot = (spot) => {
    setMapTarget({ id: spot.id, lat: spot.lat, lng: spot.lng })
    setActiveTab('map')
  }

  return (
    <div className="flex flex-col h-dvh">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 min-h-0 overflow-hidden relative isolate">
        {/* MapPage는 target이 변경될 때 key를 바꿔 재마운트 → 새 위치로 초기화 */}
        {activeTab === 'map' && (
          <MapPage key={mapTarget?.id ?? 'default'} target={mapTarget} />
        )}
        {activeTab === 'videos'     && <VideosPage onNavigate={navigateToSpot} />}
        {activeTab === 'gatherings' && <GatheringsPage />}
        {activeTab === 'favorites'  && <FavoritesPage onNavigate={navigateToSpot} />}
        {activeTab === 'events'     && <EventPage />}
        {activeTab === 'my'         && <MyPage onNavigate={navigateToSpot} />}
        {activeTab === 'admin'      && user?.admin && <AdminPage />}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={user?.admin} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
