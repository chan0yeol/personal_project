import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { id: 'map',        label: '지도' },
  { id: 'videos',     label: '영상' },
  { id: 'gatherings', label: '모임' },
  { id: 'favorites',  label: '찜' },
  { id: 'events',     label: '이벤트' },
  { id: 'my',         label: '마이' },
]

export default function Header({ activeTab, onTabChange }) {
  const { user, login, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header style={{
      height: 56, background: '#fff', borderBottom: '1px solid #EDEAF2',
      display: 'flex', alignItems: 'center', padding: '0 20px',
      flexShrink: 0, zIndex: 20,
      boxShadow: '0 1px 8px rgba(31,17,68,0.06)',
    }}>
      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
        <span style={{ fontSize: 20 }}>🕹️</span>
        <span style={{ fontWeight: 800, color: '#1A1626', fontSize: 16, letterSpacing: '-0.4px' }}>오뽑세</span>
        <span style={{
          fontSize: 11, color: '#9B94AD', fontWeight: 600,
          background: '#F7F5FA', padding: '2px 8px', borderRadius: 999,
        }}>뽑기지도</span>
      </div>

      {/* 데스크톱 네비 — 모바일 전용 레이아웃으로 고정하여 숨김 */}
      <nav className="hidden" style={{ marginLeft: 32, gap: 2 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => onTabChange(item.id)} style={{
            padding: '6px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: activeTab === item.id ? 700 : 500,
            color: activeTab === item.id ? '#7C3AED' : '#9B94AD',
            background: activeTab === item.id ? '#F6F2FF' : 'transparent',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            {item.label}
          </button>
        ))}
      </nav>

      {/* 우측 — 로그인/프로필만 */}
      <div style={{ marginLeft: 'auto' }}>
        {user === undefined ? null : user ? (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 10px 5px 5px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: dropdownOpen ? '#F6F2FF' : 'transparent', transition: 'background 0.15s',
              fontFamily: 'inherit',
            }}>
              <img src={user.profileImageUrl} alt={user.nickname} style={{
                width: 30, height: 30, borderRadius: '50%', objectFit: 'cover',
                border: '2px solid #EDE7FF',
              }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1626', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.nickname}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                <path d="M2 4l4 4 4-4" stroke="#9B94AD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: 200, background: '#fff', borderRadius: 16,
                boxShadow: '0 8px 28px rgba(31,17,68,0.14), 0 0 0 1px rgba(31,17,68,0.05)',
                overflow: 'hidden', zIndex: 50,
              }}>
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #EDEAF2' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626' }}>{user.nickname}</p>
                  <p style={{ fontSize: 11, color: '#9B94AD', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                </div>
                {[
                  { label: '마이페이지', icon: '👤', tab: 'my' },
                  { label: '찜한 뽑기방', icon: '♥', tab: 'favorites' },
                  ...(user?.admin ? [{ label: '신고 관리', icon: '🚨', tab: 'admin' }] : []),
                ].map(item => (
                  <button key={item.tab} onClick={() => { onTabChange(item.tab); setDropdownOpen(false) }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
                    fontSize: 14, color: '#1A1626', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.12s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F7F5FA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
                <div style={{ height: 1, background: '#EDEAF2', margin: '0 12px' }} />
                <button onClick={() => { logout(); setDropdownOpen(false) }} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
                  fontSize: 14, color: '#EF4444', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>↩️</span>로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={login} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
            background: '#fff', border: '1.5px solid #EDEAF2', borderRadius: 10,
            fontSize: 13, fontWeight: 700, color: '#1A1626', cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: '0 2px 6px rgba(31,17,68,0.06)',
            transition: 'all 0.15s',
          }}>
            <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 16, height: 16 }} />
            로그인
          </button>
        )}
      </div>
    </header>
  )
}
