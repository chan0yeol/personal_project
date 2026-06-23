import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMySpots, getMyLikes, getMyReviews, getMyStats, checkNickname, updateNickname } from '../api/spots'

const VIEWS = { menu: 'menu', spots: 'spots', likes: 'likes', reviews: 'reviews' }

export default function MyPage({ onNavigate }) {
  const { user, login, logout } = useAuth()
  const [view, setView] = useState(VIEWS.menu)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (user) getMyStats().then(r => setStats(r.data)).catch(() => {})
  }, [user])

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: '0 32px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#F6F2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        }}>👤</div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: '#1A1626' }}>마이페이지</p>
          <p style={{ fontSize: 13, color: '#9B94AD', marginTop: 6, lineHeight: 1.6 }}>
            로그인하면 내 뽑기방과 찜 목록을<br/>관리할 수 있어요.
          </p>
        </div>
        <button onClick={login} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 24px',
          background: '#fff', border: '1.5px solid #EDEAF2', borderRadius: 14,
          fontSize: 14, fontWeight: 700, color: '#1A1626', cursor: 'pointer',
          fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(31,17,68,0.08)',
          transition: 'all 0.15s',
        }}>
          <img src="https://www.google.com/favicon.ico" alt="" style={{ width: 18, height: 18 }} />
          Google로 로그인
        </button>
      </div>
    )
  }

  if (view === VIEWS.spots)   return <ListPage title="내가 등록한 뽑기방" fetcher={getMySpots}   onBack={() => setView(VIEWS.menu)} renderItem={SpotItem}   onNavigate={onNavigate} />
  if (view === VIEWS.likes)   return <ListPage title="찜한 뽑기방"        fetcher={getMyLikes}   onBack={() => setView(VIEWS.menu)} renderItem={SpotItem}   onNavigate={onNavigate} />
  if (view === VIEWS.reviews) return <ListPage title="내 후기"             fetcher={getMyReviews} onBack={() => setView(VIEWS.menu)} renderItem={ReviewItem} onNavigate={onNavigate} />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', background: '#F7F5FA' }}>
      {/* 프로필 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
        padding: '28px 20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={user.profileImageUrl} alt={user.nickname} style={{
            width: 64, height: 64, borderRadius: '50%', objectFit: 'cover',
            border: '3px solid rgba(255,255,255,0.4)',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>{user.nickname}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{user.email}</p>
          </div>
          <button onClick={logout} style={{
            fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            padding: '6px 12px', borderRadius: 8, fontFamily: 'inherit',
          }}>로그아웃</button>
        </div>
      </div>

      <div style={{ padding: '12px 14px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 내 뽑기 기록 통계 */}
        {stats && <StatsCard stats={stats} />}

        {/* 닉네임 변경 */}
        <NicknameEditor user={user} />

        {/* 메뉴 카드 */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(31,17,68,0.06)' }}>
          <MenuItem
            icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" fill="#7C3AED"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/></svg>}
            label="내가 등록한 뽑기방" sub="직접 등록한 장소 모아보기"
            onClick={() => setView(VIEWS.spots)}
          />
          <div style={{ height: 1, background: '#EDEAF2', margin: '0 16px' }} />
          <MenuItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B9D"><path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z" strokeWidth="0"/></svg>}
            label="찜한 뽑기방" sub="저장해둔 즐겨찾기"
            onClick={() => setView(VIEWS.likes)}
          />
          <div style={{ height: 1, background: '#EDEAF2', margin: '0 16px' }} />
          <MenuItem
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#7C3AED" strokeWidth="2" strokeLinejoin="round"/></svg>}
            label="내 후기" sub="내가 남긴 리뷰 목록"
            onClick={() => setView(VIEWS.reviews)}
          />
        </div>
      </div>
    </div>
  )
}

function NicknameEditor({ user }) {
  const [input, setInput] = useState(user.nickname || '')
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleCheck = async () => {
    const v = input.trim()
    if (v.length < 2 || v.length > 12) { setStatus('length'); return }
    setStatus('checking')
    const { data } = await checkNickname(v)
    setStatus(data.available ? 'available' : 'taken')
  }

  const handleSave = async () => {
    if (status !== 'available') return
    setSaving(true)
    try {
      await updateNickname(input.trim())
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  const statusInfo = {
    length:    { text: '2~12자로 입력해주세요', color: '#EF4444' },
    checking:  { text: '확인 중...', color: '#9B94AD' },
    available: { text: '✓ 사용 가능해요', color: '#10B981' },
    taken:     { text: '이미 사용 중이에요', color: '#EF4444' },
  }[status]

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(31,17,68,0.06)' }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: '#5B5470', marginBottom: 10 }}>닉네임 변경</p>
      <input
        value={input}
        onChange={e => { setInput(e.target.value); setStatus(null) }}
        placeholder="2~12자"
        maxLength={12}
        style={{
          width: '100%', height: 48, padding: '0 14px', borderRadius: 12, fontFamily: 'inherit',
          border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 14, color: '#1A1626',
          background: '#F7F5FA', transition: 'border-color 0.15s', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#7C3AED'}
        onBlur={e => e.target.style.borderColor = '#EDEAF2'}
      />
      {statusInfo && <p style={{ fontSize: 12, marginTop: 6, color: statusInfo.color, fontWeight: 600 }}>{statusInfo.text}</p>}
      <button onClick={handleCheck} disabled={!input.trim() || status === 'checking'} style={{
        width: '100%', height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
        marginTop: 8, background: '#F7F5FA', color: '#5B5470', fontSize: 13, fontWeight: 700,
        fontFamily: 'inherit', transition: 'all 0.15s',
        opacity: !input.trim() || status === 'checking' ? 0.4 : 1,
      }}>중복확인</button>
      {status === 'available' && (
        <button onClick={handleSave} disabled={saving} style={{
          width: '100%', height: 46, borderRadius: 12, border: 'none', cursor: 'pointer',
          marginTop: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
          background: saving ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
          color: saving ? '#9B94AD' : '#fff',
          boxShadow: saving ? 'none' : '0 4px 12px rgba(124,58,237,0.28)',
          transition: 'all 0.15s',
        }}>
          {saving ? '저장 중...' : '저장하기'}
        </button>
      )}
    </div>
  )
}

function ListPage({ title, fetcher, onBack, renderItem: Item, onNavigate }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    fetcher().then(r => setItems(r.data)).catch(() => setItems([]))
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
        background: '#fff', borderBottom: '1px solid #EDEAF2', flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#F7F5FA', color: '#5B5470', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>‹</button>
        <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>{title}</h2>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items === null && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 64 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '2.5px solid #7C3AED', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
        {items?.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 8, color: '#9B94AD' }}>
            <span style={{ fontSize: 40 }}>🗂️</span>
            <p style={{ fontSize: 14, fontWeight: 600 }}>아직 없어요.</p>
          </div>
        )}
        {items?.map(item => <Item key={item.id} item={item} onNavigate={onNavigate} />)}
      </div>
    </div>
  )
}

function SpotItem({ item, onNavigate }) {
  return (
    <button onClick={() => onNavigate({ id: item.id, lat: item.lat, lng: item.lng })} style={{
      width: '100%', background: '#fff', borderRadius: 14, padding: 16,
      border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: '0 1px 4px rgba(31,17,68,0.06)', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626' }}>{item.name}</p>
        {item.address && <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.address}</p>}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
          {item.coin500  && <Tag>🪙 500원</Tag>}
          {item.coin1000 && <Tag>💴 1000원</Tag>}
          {item.parking  && <Tag>🅿️ 주차</Tag>}
        </div>
      </div>
      <span style={{ color: '#C8C2D6', fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
  )
}

function ReviewItem({ item, onNavigate }) {
  return (
    <button onClick={() => onNavigate({ id: item.spotId, lat: item.spotLat, lng: item.spotLng })} style={{
      width: '100%', background: '#fff', borderRadius: 14, padding: 16,
      border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: '0 1px 4px rgba(31,17,68,0.06)', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: 12, color: '#7C3AED' }}>{item.spotName}</p>
        {item.spotAddress && <p style={{ fontSize: 11, color: '#9B94AD', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.spotAddress}</p>}
        <p style={{ fontSize: 13, color: '#5B5470', marginTop: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
          {item.content}
        </p>
        <p style={{ fontSize: 11, color: '#C8C2D6', marginTop: 6 }}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </div>
      <span style={{ color: '#C8C2D6', fontSize: 18, flexShrink: 0 }}>›</span>
    </button>
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

function StatsCard({ stats }) {
  const items = [
    { label: '방문 뽑기방', value: stats.visitedSpotCount, unit: '곳', emoji: '📍' },
    { label: '작성 후기', value: stats.totalReviewCount, unit: '개', emoji: '💬' },
    { label: '총 판 수', value: stats.totalPlayCount > 0 ? stats.totalPlayCount : null, unit: '판', emoji: '🎮' },
    { label: '총 지출', value: stats.totalSpendAmount > 0 ? stats.totalSpendAmount : null, unit: '원', emoji: '💸', format: v => v.toLocaleString() },
    { label: '성공률', value: stats.catchSuccessRate >= 0 ? stats.catchSuccessRate : null, unit: '%', emoji: '🎉' },
    { label: '재방문 의사', value: stats.revisitRate >= 0 ? stats.revisitRate : null, unit: '%', emoji: '🔄' },
  ]
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(31,17,68,0.06)' }}>
      <p style={{ fontWeight: 700, fontSize: 13, color: '#5B5470', marginBottom: 12 }}>내 뽑기 기록</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {items.map(item => (
          <div key={item.label} style={{ background: '#F7F5FA', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: '#9B94AD', fontWeight: 600, marginBottom: 4 }}>{item.emoji} {item.label}</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.5px' }}>
              {item.value === null || item.value === undefined
                ? <span style={{ color: '#C8C2D6', fontSize: 16 }}>-</span>
                : <>{(item.format ? item.format(item.value) : item.value)}<span style={{ fontSize: 12, fontWeight: 600, color: '#9B94AD', marginLeft: 2 }}>{item.unit}</span></>
              }
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function MenuItem({ icon, label, sub, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px', border: 'none', cursor: 'pointer', textAlign: 'left',
      background: 'transparent', fontFamily: 'inherit', transition: 'background 0.12s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = '#F7F5FA'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F6F2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626' }}>{label}</p>
        <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 2 }}>{sub}</p>
      </div>
      <span style={{ color: '#C8C2D6', fontSize: 18 }}>›</span>
    </button>
  )
}
