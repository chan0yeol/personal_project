import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getVideos, deleteVideo, previewVideo, createVideo } from '../api/spots'

export default function VideosPage({ onNavigate }) {
  const { user } = useAuth()
  const [videos, setVideos] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getVideos().then(r => setVideos(r.data)).catch(() => setVideos([]))
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('영상을 삭제할까요?')) return
    await deleteVideo(id)
    setVideos(prev => prev.filter(v => v.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  if (selected) {
    return (
      <VideoDetail
        video={selected}
        user={user}
        onBack={() => setSelected(null)}
        onDelete={handleDelete}
        onNavigate={onNavigate}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      <div style={{
        background: '#fff', padding: '18px 20px 14px', borderBottom: '1px solid #EDEAF2',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.3px' }}>영상</h2>
        {user?.admin && (
          <button onClick={() => setShowForm(true)} style={{
            height: 36, padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>＋</span> 영상 등록
          </button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {videos === null && <Spinner />}

        {videos?.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10, color: '#9B94AD' }}>
            <span style={{ fontSize: 48 }}>🎬</span>
            <p style={{ fontSize: 15, fontWeight: 700 }}>등록된 영상이 없어요</p>
          </div>
        )}

        {videos?.map(video => (
          <VideoCard key={video.id} video={video} onClick={() => setSelected(video)} />
        ))}
      </div>

      {showForm && (
        <VideoForm
          onClose={() => setShowForm(false)}
          onCreated={(v) => {
            setVideos(prev => [v, ...(prev ?? [])])
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function VideoCard({ video, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: '0 1px 4px rgba(31,17,68,0.06)', transition: 'all 0.15s',
    }}>
      {/* 썸네일 */}
      <div style={{ width: '100%', aspectRatio: '16/9', position: 'relative', background: '#1A1626', overflow: 'hidden' }}>
        <img src={video.thumbnailUrl} alt={video.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none' }} />
        {/* 유튜브 재생 오버레이 */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
        {/* 연결 스팟 수 */}
        {video.spots?.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 8, right: 8,
            background: 'rgba(26,22,38,0.75)', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
          }}>
            📍 {video.spots.length}곳
          </div>
        )}
      </div>

      {/* 텍스트 */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', letterSpacing: '-0.3px', lineHeight: 1.4 }}>
          {video.title}
        </p>
        {video.spots?.length > 0 && (
          <p style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginTop: 5 }}>
            {video.spots.map(s => s.name).join(' · ')}
          </p>
        )}
      </div>
    </button>
  )
}

function VideoDetail({ video, user, onBack, onDelete, onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      {/* 헤더 */}
      <div style={{
        background: '#fff', display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px', borderBottom: '1px solid #EDEAF2', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#F7F5FA', color: '#5B5470', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <h2 style={{ flex: 1, fontWeight: 800, fontSize: 16, color: '#1A1626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {video.title}
        </h2>
        {user?.admin && (
          <button onClick={() => onDelete(video.id)} style={{
            height: 32, padding: '0 12px', borderRadius: 8, border: 'none',
            cursor: 'pointer', background: '#FEE2E2', color: '#EF4444',
            fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
          }}>삭제</button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* 썸네일 */}
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#1A1626', position: 'relative', overflow: 'hidden' }}>
          <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 제목 + 유튜브 버튼 */}
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.4px', lineHeight: 1.4, marginBottom: 10 }}>
              {video.title}
            </h1>
            <a href={video.youtubeUrl} target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 40, padding: '0 18px', borderRadius: 10,
              background: '#FF0000', color: '#fff',
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z"/>
              </svg>
              유튜브에서 보기
            </a>
          </div>

          {/* 설명 */}
          {video.description && (
            <p style={{ fontSize: 14, color: '#5B5470', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {video.description}
            </p>
          )}

          {/* 연결 스팟 */}
          {video.spots?.length > 0 && (
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 10 }}>
                📍 촬영 뽑기방 <span style={{ color: '#7C3AED' }}>{video.spots.length}</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {video.spots.map(spot => (
                  <button key={spot.id} onClick={() => onNavigate && onNavigate(spot)} style={{
                    width: '100%', background: '#fff', borderRadius: 14, padding: '12px 14px',
                    border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                    boxShadow: '0 1px 4px rgba(31,17,68,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626' }}>{spot.name}</p>
                      <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 2 }}>{spot.address}</p>
                    </div>
                    <span style={{ fontSize: 13, color: '#7C3AED', fontWeight: 700 }}>지도에서 보기 →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 영상 등록 폼 (admin) ──────────────────────────────
function VideoForm({ onClose, onCreated }) {
  const [urlInput, setUrlInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState('')
  const [spotSearch, setSpotSearch] = useState('')
  const [spotResults, setSpotResults] = useState([])
  const [selectedSpots, setSelectedSpots] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [titleInput, setTitleInput] = useState('')

  const handlePreview = async () => {
    if (!urlInput.trim()) return
    setLoading(true)
    try {
      const r = await previewVideo(urlInput)
      setPreview(r.data)
      setTitleInput(r.data.title || '')
    } catch {
      alert('유효하지 않은 유튜브 URL입니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSpotSearch = (keyword) => {
    setSpotSearch(keyword)
    if (!keyword.trim()) { setSpotResults([]); return }
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(keyword + ' 인형뽑기', (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSpotResults(result.slice(0, 5))
      }
    })
  }

  const handleSpotSelect = async (kakaoPlace) => {
    const { getSpots } = await import('../api/spots')
    const lat = Number(kakaoPlace.y)
    const lng = Number(kakaoPlace.x)
    const delta = 0.003
    const res = await getSpots({ swLat: lat - delta, neLat: lat + delta, swLng: lng - delta, neLng: lng + delta })
    const found = res.data.find(s =>
      Math.abs(s.lat - lat) < 0.001 && Math.abs(s.lng - lng) < 0.001
    )
    if (found && !selectedSpots.find(s => s.id === found.id)) {
      setSelectedSpots(prev => [...prev, found])
    } else if (!found) {
      alert('등록된 스팟을 찾을 수 없어요. 지도에서 직접 스팟을 선택해주세요.')
    }
    setSpotSearch('')
    setSpotResults([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!preview) return
    setSubmitting(true)
    try {
      const r = await createVideo({
        youtubeId: preview.youtubeId,
        title: titleInput || preview.title,
        description: description || null,
        spotIds: selectedSpots.map(s => s.id),
      })
      onCreated(r.data)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid #EDEAF2',
    outline: 'none', fontSize: 13, fontFamily: 'inherit', background: '#F7F5FA', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,38,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: '18px 18px 80px', maxHeight: 'calc(90dvh - 56px)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>영상 등록</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9B94AD' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* URL 입력 */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>유튜브 URL *</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setPreview(null) }}
                placeholder="https://youtu.be/..." style={{ ...inputStyle, flex: 1 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
              <button type="button" onClick={handlePreview} disabled={loading || !urlInput.trim()} style={{
                height: 44, padding: '0 14px', borderRadius: 10, border: 'none',
                cursor: loading || !urlInput.trim() ? 'not-allowed' : 'pointer',
                background: loading || !urlInput.trim() ? '#EDEAF2' : '#7C3AED',
                color: loading || !urlInput.trim() ? '#9B94AD' : '#fff',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', flexShrink: 0,
              }}>{loading ? '...' : '확인'}</button>
            </div>
          </div>

          {/* 미리보기 */}
          {preview && (
            <div style={{ background: '#F7F5FA', borderRadius: 12, overflow: 'hidden' }}>
              <img src={preview.thumbnailUrl} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }} />
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: 11, color: '#9B94AD', marginBottom: 5 }}>ID: {preview.youtubeId}</p>
              </div>
            </div>
          )}

          {/* 제목 (oEmbed 자동완성, 직접 수정 가능) */}
          {preview && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>제목 *</label>
              <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
                placeholder="영상 제목을 입력하세요" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
            </div>
          )}

          {preview && (
            <>
              {/* 설명 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>설명 (선택)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  placeholder="영상에 대한 간단한 설명"
                  style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.5 }}
                  onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
              </div>

              {/* 스팟 연결 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>촬영 뽑기방 연결</label>
                <div style={{ position: 'relative' }}>
                  <input value={spotSearch} onChange={e => handleSpotSearch(e.target.value)}
                    placeholder="뽑기방 이름 또는 주소 검색" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => setTimeout(() => setSpotResults([]), 200)} />
                  {spotResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                      borderRadius: 10, boxShadow: '0 4px 16px rgba(31,17,68,0.12)', zIndex: 10, marginTop: 4,
                    }}>
                      {spotResults.map(place => (
                        <button key={place.id} type="button" onMouseDown={() => handleSpotSelect(place)} style={{
                          width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                          borderBottom: '1px solid #F7F5FA',
                        }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1626' }}>{place.place_name}</p>
                          <p style={{ fontSize: 11, color: '#9B94AD', marginTop: 2 }}>{place.road_address_name || place.address_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedSpots.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedSpots.map(spot => (
                      <div key={spot.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: '#EDE7FF', borderRadius: 8, padding: '8px 12px',
                      }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{spot.name}</p>
                          <p style={{ fontSize: 11, color: '#9B6CFF' }}>{spot.address}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedSpots(prev => prev.filter(s => s.id !== spot.id))} style={{
                          background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#9B6CFF',
                        }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={submitting} style={{
                height: 48, borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                background: submitting ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
                color: submitting ? '#9B94AD' : '#fff', fontSize: 14, fontWeight: 800,
                fontFamily: 'inherit', marginTop: 4,
                boxShadow: submitting ? 'none' : '0 4px 14px rgba(124,58,237,0.28)',
              }}>
                {submitting ? '등록 중...' : '등록하기'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
