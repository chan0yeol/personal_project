import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getGatherings, getGathering, joinGathering, leaveGathering, deleteGathering,
  getGatheringParticipants, getGatheringComments,
  createGatheringComment, deleteGatheringComment,
} from '../api/spots'

const STATUS_LABEL = { OPEN: '모집중', CLOSED: '마감', CANCELLED: '취소', ENDED: '종료' }
const STATUS_COLOR = { OPEN: '#7C3AED', CLOSED: '#9B94AD', CANCELLED: '#EF4444', ENDED: '#9B94AD' }
const STATUS_BG    = { OPEN: '#EDE7FF', CLOSED: '#F7F5FA', CANCELLED: '#FEE2E2', ENDED: '#F7F5FA' }

export default function GatheringsPage() {
  const { user, login } = useAuth()
  const [gatherings, setGatherings] = useState(null)
  const [filter, setFilter] = useState('all') // all | mine
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    getGatherings().then(r => setGatherings(r.data)).catch(() => setGatherings([]))
  }, [])

  const displayed = gatherings?.filter(g => {
    if (filter === 'mine') return g.joined || g.host
    return true
  })

  const handleJoin = async (id) => {
    const { data } = await joinGathering(id)
    setGatherings(prev => prev.map(g => g.id === id ? data : g))
  }

  const handleLeave = async (id) => {
    await leaveGathering(id)
    getGatherings().then(r => setGatherings(r.data))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('모임을 취소할까요?')) return
    await deleteGathering(id)
    setGatherings(prev => prev.filter(g => g.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  if (selectedId) {
    return (
      <GatheringDetailPage
        gatheringId={selectedId}
        user={user}
        login={login}
        onBack={() => setSelectedId(null)}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', padding: '18px 20px 0', borderBottom: '1px solid #EDEAF2', flexShrink: 0 }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.3px', marginBottom: 12 }}>모임</h2>
        {/* 필터 탭 */}
        <div style={{ display: 'flex', gap: 0 }}>
          {[{ id: 'all', label: '전체' }, { id: 'mine', label: '내 모임' }].map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', background: 'transparent',
              fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              color: filter === tab.id ? '#7C3AED' : '#9B94AD',
              borderBottom: filter === tab.id ? '2px solid #7C3AED' : '2px solid transparent',
              transition: 'all 0.15s', marginBottom: -1,
            }}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {gatherings === null && <Spinner />}

        {filter === 'mine' && !user && (
          <EmptyState icon="👥" title="내 모임" desc="로그인하면 참여 중인 모임을 볼 수 있어요.">
            <button onClick={login} style={{
              padding: '12px 24px', borderRadius: 12, border: '1.5px solid #EDEAF2',
              background: '#fff', fontSize: 14, fontWeight: 700, color: '#1A1626',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>로그인하기</button>
          </EmptyState>
        )}

        {displayed?.length === 0 && !(filter === 'mine' && !user) && (
          <EmptyState icon="👥" title="모임이 없어요"
            desc={filter === 'mine' ? '참여 중인 모임이 없어요.\n뽑기방을 찾아 모임을 만들어보세요!' : '아직 등록된 모임이 없어요.'} />
        )}

        {displayed?.map(g => (
          <GatheringFeedCard key={g.id} gathering={g} onClick={() => setSelectedId(g.id)} />
        ))}
      </div>
    </div>
  )
}

function GatheringFeedCard({ gathering: g, onClick }) {
  const isPast = new Date(g.meetAt) < new Date()
  const effectiveStatus = isPast && g.status === 'OPEN' ? 'ENDED' : g.status
  const meetDate = new Date(g.meetAt)

  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#fff', borderRadius: 18, padding: '16px 18px',
      border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: '0 1px 6px rgba(31,17,68,0.07)', transition: 'all 0.15s',
      opacity: isPast || g.status === 'CANCELLED' ? 0.6 : 1,
    }}>
      {/* 상단: 상태 + 정기모임 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
          background: STATUS_BG[effectiveStatus], color: STATUS_COLOR[effectiveStatus],
        }}>{STATUS_LABEL[effectiveStatus]}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {g.isRecurring && <span style={{ fontSize: 11, color: '#9B94AD', fontWeight: 600 }}>🔄 정기</span>}
          {(g.joined || g.host) && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', background: '#EDE7FF', padding: '2px 8px', borderRadius: 999 }}>
              {g.host ? '개설' : '참여중'}
            </span>
          )}
        </div>
      </div>

      {/* 제목 */}
      <p style={{ fontWeight: 800, fontSize: 15, color: '#1A1626', letterSpacing: '-0.3px', marginBottom: 6 }}>{g.title}</p>

      {/* 스팟명 */}
      <p style={{ fontSize: 12, color: '#7C3AED', fontWeight: 700, marginBottom: 8 }}>📍 {g.spotName}</p>

      {/* 구분선 */}
      <div style={{ height: 1, background: '#F0EDF8', margin: '8px 0' }} />

      {/* 하단 메타 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 12, color: '#5B5470', fontWeight: 600 }}>
            📅 {meetDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            &nbsp;{meetDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontSize: 11, color: '#9B94AD' }}>개설자 {g.hostNickname}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#F7F5FA', borderRadius: 999, padding: '5px 12px',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5" stroke="#9B94AD" strokeWidth="2" />
            <path d="M5 19c1-4 4-6 7-6s6 2 7 6" stroke="#9B94AD" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5B5470' }}>
            {g.participantCount}{g.maxParticipants ? `/${g.maxParticipants}` : ''}
          </span>
        </div>
      </div>
    </button>
  )
}

function GatheringDetailPage({ gatheringId, user, login, onBack, onJoin, onLeave, onDelete }) {
  const [gathering, setGathering] = useState(null)
  const [participants, setParticipants] = useState([])
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      getGathering(gatheringId),
      getGatheringParticipants(gatheringId),
      getGatheringComments(gatheringId),
    ]).then(([g, p, c]) => {
      setGathering(g.data)
      setParticipants(p.data)
      setComments(c.data)
    })
  }, [gatheringId])

  const refreshGathering = async () => {
    const [g, p] = await Promise.all([
      getGathering(gatheringId),
      getGatheringParticipants(gatheringId),
    ])
    setGathering(g.data)
    setParticipants(p.data)
  }

  const handleJoinClick = async () => {
    await joinGathering(gatheringId)
    await refreshGathering()
    onJoin(gatheringId)
  }

  const handleLeaveClick = async () => {
    await leaveGathering(gatheringId)
    await refreshGathering()
    onLeave(gatheringId)
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const r = await createGatheringComment(gatheringId, { content })
      setComments(prev => [...prev, r.data])
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (id) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    await deleteGatheringComment(id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  if (!gathering) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spinner />
    </div>
  )

  const isPast = new Date(gathering.meetAt) < new Date()
  const isFull = gathering.maxParticipants && gathering.participantCount >= gathering.maxParticipants
  const effectiveStatus = isPast && gathering.status === 'OPEN' ? 'ENDED' : gathering.status

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      {/* 헤더 */}
      <div style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid #EDEAF2', flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#F7F5FA', color: '#5B5470', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <h2 style={{ flex: 1, fontWeight: 800, fontSize: 16, color: '#1A1626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gathering.title}</h2>
        {gathering.host && (
          <button onClick={() => onDelete(gatheringId)} style={{ height: 32, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#FEE2E2', color: '#EF4444', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>취소</button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* 모임 정보 카드 */}
        <div style={{ margin: '12px 16px', background: '#fff', borderRadius: 18, padding: '18px', boxShadow: '0 1px 6px rgba(31,17,68,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 999, background: STATUS_BG[effectiveStatus], color: STATUS_COLOR[effectiveStatus] }}>
              {STATUS_LABEL[effectiveStatus]}
            </span>
            {gathering.isRecurring && <span style={{ fontSize: 11, color: '#9B94AD', fontWeight: 600 }}>🔄 정기모임</span>}
          </div>

          <p style={{ fontSize: 14, color: '#5B5470', lineHeight: 1.7, marginBottom: 14 }}>{gathering.description || '설명 없음'}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 13, color: '#1A1626', fontWeight: 700 }}>📍 {gathering.spotName}</p>
            <p style={{ fontSize: 13, color: '#5B5470' }}>📅 {new Date(gathering.meetAt).toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p style={{ fontSize: 13, color: '#5B5470' }}>👤 개설자: {gathering.hostNickname}</p>
            <p style={{ fontSize: 13, color: '#5B5470' }}>👥 {gathering.participantCount}{gathering.maxParticipants ? `/${gathering.maxParticipants}` : ''}명 참여중</p>
          </div>

          {/* 참여 버튼 */}
          {isPast ? (
            <p style={{ marginTop: 14, textAlign: 'center', fontSize: 13, color: '#9B94AD', fontWeight: 600 }}>종료된 모임입니다</p>
          ) : user && !gathering.host && gathering.status === 'OPEN' ? (
            <button
              onClick={() => gathering.joined ? handleLeaveClick() : handleJoinClick()}
              disabled={!gathering.joined && isFull}
              style={{
                marginTop: 14, width: '100%', height: 44, borderRadius: 12, border: 'none',
                cursor: isFull && !gathering.joined ? 'not-allowed' : 'pointer',
                background: gathering.joined ? '#FEE2E2' : isFull ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
                color: gathering.joined ? '#EF4444' : isFull ? '#9B94AD' : '#fff',
                fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
                boxShadow: gathering.joined || isFull ? 'none' : '0 4px 14px rgba(124,58,237,0.28)',
              }}
            >{gathering.joined ? '참여 취소' : isFull ? '정원 마감' : '참여하기'}</button>
          ) : !user ? (
            <button onClick={login} style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, border: '1.5px solid #EDEAF2', cursor: 'pointer', background: '#fff', color: '#7C3AED', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}>로그인 후 참여</button>
          ) : null}
        </div>

        {/* 참여자 */}
        <div style={{ margin: '0 16px 12px', background: '#fff', borderRadius: 18, padding: '16px 18px', boxShadow: '0 1px 6px rgba(31,17,68,0.07)' }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 12 }}>참여자 {participants.length}명</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {participants.map(p => (
              <div key={p.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {p.profileImageUrl
                  ? <img src={p.profileImageUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #EDE7FF' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EDE7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#7C3AED' }}>{p.nickname?.[0]?.toUpperCase()}</div>
                }
                <span style={{ fontSize: 10, color: '#9B94AD', maxWidth: 44, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 댓글 */}
        <div style={{ margin: '0 16px 24px', background: '#fff', borderRadius: 18, padding: '16px 18px', boxShadow: '0 1px 6px rgba(31,17,68,0.07)' }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 12 }}>댓글 <span style={{ color: '#7C3AED' }}>{comments.length}</span></p>
          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: '#9B94AD', textAlign: 'center', padding: '16px 0' }}>첫 댓글을 남겨보세요!</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.map(c => (
              <div key={c.id} style={{ background: '#F7F5FA', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#EDE7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#7C3AED' }}>{c.nickname?.[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1626' }}>{c.nickname}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#C8C2D6' }}>{new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    {user?.id === c.userId && (
                      <button onClick={() => handleDeleteComment(c.id)} style={{ fontSize: 11, color: '#C8C2D6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#5B5470', lineHeight: 1.6 }}>{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 댓글 입력 */}
      {isPast ? (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #EDEAF2', background: '#F7F5FA', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: '#9B94AD', fontWeight: 600 }}>종료된 모임은 댓글을 작성할 수 없어요</p>
        </div>
      ) : user ? (
        <form onSubmit={handleComment} style={{ padding: '12px 16px', borderTop: '1px solid #EDEAF2', background: '#fff', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="댓글을 입력하세요..."
            style={{ flex: 1, height: 44, padding: '0 14px', borderRadius: 12, border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: '#F7F5FA', transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          <button type="submit" disabled={submitting || !content.trim()} style={{
            height: 44, padding: '0 18px', borderRadius: 12, border: 'none',
            cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
            background: submitting || !content.trim() ? '#EDEAF2' : '#7C3AED',
            color: submitting || !content.trim() ? '#9B94AD' : '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          }}>등록</button>
        </form>
      ) : (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #EDEAF2', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 13, color: '#9B94AD' }}>로그인 후 댓글을 남길 수 있어요</p>
          <button onClick={login} style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>로그인 →</button>
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, title, desc, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10, color: '#9B94AD' }}>
      <span style={{ fontSize: 48 }}>{icon}</span>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1626' }}>{title}</p>
      {desc && <p style={{ fontSize: 13, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{desc}</p>}
      {children}
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
