import { useState, useCallback, useEffect, useRef } from 'react'
import { Map, MapMarker, MarkerClusterer } from 'react-kakao-maps-sdk'
import { getSpots, getSpot, getSpotRanking, getNearbySpots } from '../api/spots'
import { useAuth } from '../context/AuthContext'
import SpotPanel from '../components/SpotPanel'
import SpotForm from '../components/SpotForm'
import SearchBar from '../components/SearchBar'

const INITIAL_CENTER = { lat: 37.5665, lng: 126.9780 }

const applyFilter = (spots, filter) => {
  if (filter === 'all')     return spots
  if (filter === 'coin500') return spots.filter(s => s.coin500)
  if (filter === 'open24')  return spots.filter(s => s.openTime?.includes('24'))
  if (filter === 'parking') return spots.filter(s => s.parking)
  if (filter === 'rating4') return spots.filter(s => s.avgRating >= 4)
  return spots
}

// target: 마이페이지에서 넘어온 { id, lat, lng } — 있으면 해당 위치로 초기화
export default function MapPage({ target = null }) {
  const { user, login } = useAuth()
  const [spots, setSpots] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedSpotId, setSelectedSpotId] = useState(target?.id ?? null)
  const [registerMode, setRegisterMode] = useState(false)
  const [loginPrompt, setLoginPrompt] = useState(false) // 비로그인 시 안내 토스트
  const [newPosition, setNewPosition] = useState(null)
  const [center, setCenter] = useState(
    target ? { lat: target.lat, lng: target.lng } : INITIAL_CENTER
  )
  const [myLocation, setMyLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [gpsError, setGpsError] = useState(null)
  const [showRanking, setShowRanking] = useState(false)
  const [ranking, setRanking] = useState(null)
  const [showNearby, setShowNearby] = useState(false)
  const [nearbySpots, setNearbySpots] = useState(null)
  const [nearbyRadius, setNearbyRadius] = useState(2000)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!gpsError) return
    const t = setTimeout(() => setGpsError(null), 3500)
    return () => clearTimeout(t)
  }, [gpsError])

  // URL ?spotId= 파라미터로 진입 시 해당 스팟 자동 오픈
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const spotIdParam = params.get('spotId')
    if (!spotIdParam) return
    getSpot(Number(spotIdParam))
      .then(r => {
        setCenter({ lat: r.data.lat, lng: r.data.lng })
        setSelectedSpotId(Number(spotIdParam))
        window.history.replaceState({}, '', window.location.pathname)
      })
      .catch(() => {})
  }, [])

  // 로그인 안내 토스트 자동 제거
  useEffect(() => {
    if (!loginPrompt) return
    const t = setTimeout(() => setLoginPrompt(false), 3000)
    return () => clearTimeout(t)
  }, [loginPrompt])

  // 등록 버튼 클릭 - 비로그인 시 안내
  const handleRegisterClick = () => {
    if (!user) { setLoginPrompt(true); return }
    setRegisterMode(p => !p)
    setNewPosition(null)
  }

  // 검색 결과 선택 → 지도 이동
  const handleSearchSelect = ({ lat, lng }) => {
    setCenter({ lat, lng })
    if (mapRef.current) mapRef.current.setLevel(4)
  }

  const fetchSpots = useCallback(async (map) => {
    const bounds = map.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const res = await getSpots({
      swLat: sw.getLat(), neLat: ne.getLat(),
      swLng: sw.getLng(), neLng: ne.getLng(),
    })
    setSpots(res.data)
  }, [])

  const handleShowRanking = () => {
    if (!mapRef.current) return
    const bounds = mapRef.current.getBounds()
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    setRanking(null)
    setShowRanking(true)
    getSpotRanking({
      swLat: sw.getLat(), neLat: ne.getLat(),
      swLng: sw.getLng(), neLng: ne.getLng(),
    }).then(r => setRanking(r.data)).catch(() => setRanking([]))
  }

  const handleMapClick = (_map, e) => {
    if (!registerMode) return
    setNewPosition({ lat: e.latLng.getLat(), lng: e.latLng.getLng() })
  }

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGpsError('이 브라우저는 위치 서비스를 지원하지 않아요.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude }
        setMyLocation(pos)
        setCenter(pos)
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('위치 권한을 허용해주세요.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('현재 위치를 가져올 수 없어요.')
        } else {
          setGpsError('GPS 요청이 실패했어요. 다시 시도해주세요.')
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const handleShowNearby = (radius = nearbyRadius) => {
    if (!navigator.geolocation) { setGpsError('이 브라우저는 위치 서비스를 지원하지 않아요.'); return }
    setNearbySpots(null)
    setShowNearby(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude, lng = coords.longitude
        setMyLocation({ lat, lng })
        getNearbySpots(lat, lng, radius)
          .then(r => setNearbySpots(r.data))
          .catch(() => setNearbySpots([]))
      },
      () => { setShowNearby(false); setGpsError('위치 권한을 허용해주세요.') },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* 검색 영역 — 스팟 패널 열리면 숨김 */}
      {!selectedSpotId && (
        <div style={{
          background: '#fff', padding: '10px 14px 12px', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(31,17,68,0.06)',
          position: 'relative', zIndex: 20,
        }}>
          <SearchBar
            onSelect={handleSearchSelect}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </div>
      )}

      {/* 지도 영역 */}
      <div className="relative flex-1 min-h-0">

      {/* 토스트 */}
      {gpsError && (
        <div style={{
          position: 'absolute', top: 130, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, background: '#1A1626', color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '10px 18px', borderRadius: 999, whiteSpace: 'nowrap',
          boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
        }}>
          {gpsError}
        </div>
      )}
      {loginPrompt && (
        <div style={{
          position: 'absolute', top: 130, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, background: '#1A1626', color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '10px 18px', borderRadius: 999, whiteSpace: 'nowrap',
          boxShadow: '0 6px 18px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span>로그인 후 이용할 수 있어요</span>
          <button onClick={login} style={{
            color: '#B898FF', fontWeight: 700, background: 'none', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
          }}>로그인</button>
        </div>
      )}

      {/* 등록 모드 안내 배너 */}
      {registerMode && (
        <div style={{
          position: 'absolute', top: 130, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 700,
          padding: '10px 20px', borderRadius: 999, whiteSpace: 'nowrap',
          boxShadow: '0 6px 16px rgba(124,58,237,0.35)',
        }}>
          지도를 탭하여 위치를 선택하세요
        </div>
      )}

      {/* 랭킹 패널 */}
      {showRanking && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(26,22,38,0.4)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowRanking(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '20px 20px 80px', maxHeight: 'calc(70dvh - 56px)', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>이 지역 TOP 랭킹</h3>
              <button onClick={() => setShowRanking(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9B94AD' }}>✕</button>
            </div>
            {ranking === null ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : ranking.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9B94AD', fontSize: 14, padding: '24px 0' }}>이 지역에 등록된 스팟이 없어요</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {ranking.map((spot, i) => (
                  <button key={spot.id} onClick={() => { setSelectedSpotId(spot.id); setCenter({ lat: spot.lat, lng: spot.lng }); setShowRanking(false) }} style={{
                    width: '100%', background: '#F7F5FA', borderRadius: 14, padding: '12px 14px',
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: i < 3 ? '#7C3AED' : '#9B94AD', minWidth: 28 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot.name}</p>
                      <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot.address}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      {spot.avgRating > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24' }}>★ {spot.avgRating}</span>}
                      <span style={{ fontSize: 11, color: '#9B94AD' }}>리뷰 {spot.reviewCount} · 찜 {spot.likeCount}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 근처 스팟 바텀시트 */}
      {showNearby && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25, background: 'rgba(26,22,38,0.4)',
          display: 'flex', alignItems: 'flex-end',
        }} onClick={() => setShowNearby(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '20px 20px 80px', maxHeight: 'calc(75dvh - 56px)', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>📍 근처 뽑기방</h3>
              <button onClick={() => setShowNearby(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9B94AD' }}>✕</button>
            </div>
            {/* 반경 선택 칩 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[500, 1000, 2000, 5000].map(r => (
                <button key={r} onClick={() => { setNearbyRadius(r); handleShowNearby(r) }} style={{
                  height: 30, padding: '0 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                  background: nearbyRadius === r ? '#7C3AED' : '#F7F5FA',
                  color: nearbyRadius === r ? '#fff' : '#9B94AD',
                }}>
                  {r < 1000 ? `${r}m` : `${r / 1000}km`}
                </button>
              ))}
            </div>
            {nearbySpots === null ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : nearbySpots.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9B94AD', fontSize: 14, padding: '24px 0' }}>반경 내 등록된 뽑기방이 없어요</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {nearbySpots.map(spot => (
                  <button key={spot.id} onClick={() => {
                    setSelectedSpotId(spot.id)
                    setCenter({ lat: spot.lat, lng: spot.lng })
                    setShowNearby(false)
                  }} style={{
                    width: '100%', background: '#F7F5FA', borderRadius: 14, padding: '12px 14px',
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot.name}</p>
                      <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spot.address}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>
                        {spot.distanceMeters < 1000
                          ? `${Math.round(spot.distanceMeters)}m`
                          : `${(spot.distanceMeters / 1000).toFixed(1)}km`}
                      </span>
                      {spot.avgRating > 0 && <span style={{ fontSize: 11, color: '#FBBF24', fontWeight: 700 }}>★ {spot.avgRating}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 내 주변 뽑기방 버튼 — 좌측 하단 */}
      {!selectedSpotId && (
        <button onClick={() => handleShowNearby(nearbyRadius)} style={{
          position: 'absolute', bottom: 24, left: 14, zIndex: 20,
          height: 44, padding: '0 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
          fontSize: 14, fontWeight: 800,
          background: 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
          color: '#fff',
          boxShadow: '0 6px 20px rgba(124,58,237,0.38)',
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5c0-3-2.5-5.5-5.5-5.5Z"
              stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="9" cy="7" r="2" fill="#fff"/>
          </svg>
          내 주변 뽑기방
        </button>
      )}

      {/* FAB 버튼 그룹 — 스팟 패널 열리면 숨김 */}
      {!selectedSpotId && <div style={{
        position: 'absolute', bottom: 24, right: 14, zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
      }}>
        {/* 랭킹 버튼 */}
        <button onClick={handleShowRanking} style={{
          height: 40, padding: '0 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
          fontSize: 13, fontWeight: 700, background: '#fff', color: '#7C3AED',
          boxShadow: '0 6px 18px rgba(31,17,68,0.14)',
        }}>
          🏆 이 지역 랭킹
        </button>
        {/* 등록 버튼 */}
        <button
          onClick={handleRegisterClick}
          style={{
            height: 40, padding: '0 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
            background: registerMode ? '#7C3AED' : '#fff',
            color: registerMode ? '#fff' : '#7C3AED',
            boxShadow: registerMode
              ? '0 6px 16px rgba(124,58,237,0.35)'
              : '0 6px 18px rgba(31,17,68,0.14)',
          }}
        >
          {registerMode ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              취소
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
              뽑기방 등록
            </>
          )}
        </button>
        {/* GPS FAB */}
        <button
          onClick={handleLocate}
          disabled={locating}
          title="내 위치"
          style={{
            width: 52, height: 52, background: '#fff', borderRadius: 999, border: '2px solid #EDE7FF',
            boxShadow: '0 8px 22px rgba(31,17,68,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: locating ? 'not-allowed' : 'pointer', opacity: locating ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="3.2" fill={locating ? '#9B94AD' : '#7C3AED'} />
            <circle cx="11" cy="11" r="7.5" stroke={locating ? '#9B94AD' : '#7C3AED'} strokeWidth="2" fill="none" />
            <path d="M11 1.5v3M11 17.5v3M1.5 11h3M17.5 11h3"
              stroke={locating ? '#9B94AD' : '#7C3AED'} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>}

      <Map
        center={center}
        isPanto={true}
        style={{ width: '100%', height: '100%' }}
        level={target ? 3 : 5}
        onCreate={fetchSpots}   // 맵 생성 즉시 스팟 로드 (네비게이션 후 마커 누락 방지)
        onIdle={fetchSpots}     // 이동/줌 후 스팟 갱신
        onClick={handleMapClick}
        ref={mapRef}
      >
        {/* 줌 레벨 7 이상(멀리 볼 때) 클러스터로 묶어서 개수 표시 */}
        <MarkerClusterer averageCenter={true} minLevel={7}>
          {applyFilter(spots, activeFilter).map(spot => (
            <MapMarker
              key={spot.id}
              position={{ lat: spot.lat, lng: spot.lng }}
              onClick={() => { setSelectedSpotId(spot.id); setRegisterMode(false) }}
            />
          ))}
        </MarkerClusterer>
        {myLocation && (
          <MapMarker
            position={myLocation}
            image={{
              src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
              size: { width: 24, height: 35 },
            }}
          />
        )}
        {newPosition && <MapMarker position={newPosition} />}
      </Map>

      {selectedSpotId && (
        <SpotPanel
          spotId={selectedSpotId}
          onClose={() => setSelectedSpotId(null)}
        />
      )}

      {newPosition && registerMode && (
        <SpotForm
          position={newPosition}
          onClose={() => { setNewPosition(null); setRegisterMode(false) }}
          onCreated={() => {
            setNewPosition(null)
            setRegisterMode(false)
            // 등록 직후 지도에 새 마커 즉시 반영
            if (mapRef.current) fetchSpots(mapRef.current)
          }}
        />
      )}
      </div>{/* 지도 영역 끝 */}
    </div>
  )
}
