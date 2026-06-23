import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyLikes } from '../api/spots'

export default function FavoritesPage({ onNavigate }) {
  const { user, login } = useAuth()
  const [spots, setSpots] = useState(null)

  useEffect(() => {
    if (!user) return
    getMyLikes().then(r => setSpots(r.data)).catch(() => setSpots([]))
  }, [user])

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: '0 32px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FFE5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>♥</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: '#1A1626' }}>찜한 뽑기방</p>
          <p style={{ fontSize: 13, color: '#9B94AD', marginTop: 6, lineHeight: 1.6 }}>
            로그인하면 찜한 뽑기방을<br />모아볼 수 있어요.
          </p>
        </div>
        <button onClick={login} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px',
          background: '#fff', border: '1.5px solid #EDEAF2', borderRadius: 14,
          fontSize: 14, fontWeight: 700, color: '#1A1626', cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(31,17,68,0.08)',
        }}>
          <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 18, height: 18 }} />
          Google로 로그인
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '18px 20px 14px', borderBottom: '1px solid #EDEAF2', flexShrink: 0 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.3px' }}>찜한 뽑기방</h2>
        {spots && (
          <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 4 }}>
            총 <span style={{ color: '#7C3AED', fontWeight: 700 }}>{spots.length}곳</span>
          </p>
        )}
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {spots === null && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '2.5px solid #7C3AED', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {spots?.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10, color: '#9B94AD' }}>
            <span style={{ fontSize: 48 }}>♡</span>
            <p style={{ fontSize: 15, fontWeight: 700 }}>찜한 뽑기방이 없어요</p>
            <p style={{ fontSize: 13 }}>마음에 드는 뽑기방을 찜해보세요!</p>
          </div>
        )}

        {spots?.map(spot => (
          <button key={spot.id} onClick={() => onNavigate?.({ id: spot.id, lat: spot.lat, lng: spot.lng })} style={{
            width: '100%', background: '#fff', borderRadius: 14, padding: 16,
            border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            boxShadow: '0 1px 4px rgba(31,17,68,0.06)', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {/* 찜 아이콘 */}
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFE5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B9D">
                <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626' }}>{spot.name}</p>
              {spot.address && (
                <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {spot.address}
                </p>
              )}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                {spot.coin500  && <Tag>🪙 500원</Tag>}
                {spot.coin1000 && <Tag>💴 1000원</Tag>}
                {spot.parking  && <Tag>🅿️ 주차</Tag>}
              </div>
            </div>
            <span style={{ color: '#C8C2D6', fontSize: 18, flexShrink: 0 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Tag({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 6, background: '#F6F2FF', color: '#6D28D9',
    }}>{children}</span>
  )
}
