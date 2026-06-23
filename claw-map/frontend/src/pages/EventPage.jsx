import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getEvents, getEvent, getEventComments, createEventComment, deleteEventComment, createEvent, updateEvent, deleteEvent, uploadImage } from '../api/spots'

export default function EventPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getEvents().then(r => setEvents(r.data)).catch(() => setEvents([]))
  }, [])

  if (selectedId) {
    return (
      <EventDetail
        eventId={selectedId}
        onBack={() => setSelectedId(null)}
        onDeleted={() => {
          setEvents(prev => prev.filter(e => e.id !== selectedId))
          setSelectedId(null)
        }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F5FA' }}>
      <div style={{
        background: '#fff', padding: '18px 20px 14px', borderBottom: '1px solid #EDEAF2',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.3px' }}>이벤트</h2>
        {user?.admin && (
          <button onClick={() => setShowForm(true)} style={{
            height: 36, padding: '0 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#7C3AED', color: '#fff', fontSize: 13, fontWeight: 700,
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>＋</span> 이벤트 등록
          </button>
        )}
      </div>

      {showForm && (
        <EventForm
          onClose={() => setShowForm(false)}
          onCreated={(ev) => {
            setEvents(prev => [ev, ...(prev ?? [])])
            setShowForm(false)
          }}
        />
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events === null && <Spinner />}

        {events?.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 10, color: '#9B94AD' }}>
            <span style={{ fontSize: 48 }}>🎁</span>
            <p style={{ fontSize: 15, fontWeight: 700 }}>진행 중인 이벤트가 없어요</p>
          </div>
        )}

        {events?.map(event => (
          <EventCard key={event.id} event={event} onClick={() => setSelectedId(event.id)} />
        ))}
      </div>
    </div>
  )
}

function EventCard({ event, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#fff', borderRadius: 16, overflow: 'hidden',
      border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      boxShadow: '0 1px 4px rgba(31,17,68,0.06)', transition: 'all 0.15s',
      opacity: event.active ? 1 : 0.6,
      filter: event.active ? 'none' : 'grayscale(0.4)',
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* 썸네일 */}
      <div style={{
        width: 90, flexShrink: 0,
        background: event.active
          ? 'linear-gradient(135deg, #FF8FB1 0%, #9B6CFF 55%, #7C3AED 100%)'
          : 'linear-gradient(135deg, #C8C2D6, #9B94AD)',
        position: 'relative', overflow: 'hidden',
      }}>
        {event.imageUrl
          ? <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, opacity: 0.5 }}>🎁</div>
        }
      </div>

      {/* 텍스트 */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5 }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <Badge active={event.active}>{event.active ? '진행중' : '종료'}</Badge>
          {event.active && <Badge red>D-{event.dday <= 0 ? 'DAY' : event.dday}</Badge>}
        </div>
        <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </p>
        <p style={{ fontSize: 11, color: '#9B94AD' }}>{event.startDate} ~ {event.endDate}</p>
      </div>
    </button>
  )
}

function EventDetail({ eventId, onBack, onDeleted }) {
  const { user, login } = useAuth()
  const [event, setEvent] = useState(null)
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    getEvent(eventId).then(r => setEvent(r.data))
    getEventComments(eventId).then(r => setComments(r.data))
  }, [eventId])

  const handleDelete = async () => {
    if (!window.confirm('이벤트를 삭제할까요?')) return
    await deleteEvent(eventId)
    onDeleted()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const r = await createEventComment(eventId, { content })
      setComments(prev => [...prev, r.data])
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplyDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    await deleteEventComment(commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  if (!event) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Spinner />
    </div>
  )

  if (showEditForm) {
    return (
      <EventForm
        initialData={event}
        onClose={() => setShowEditForm(false)}
        onCreated={(updated) => {
          setEvent(updated)
          setShowEditForm(false)
        }}
      />
    )
  }

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
        <h2 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </h2>
        {user?.admin && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setShowEditForm(true)} style={{
              height: 32, padding: '0 12px', borderRadius: 8, border: '1.5px solid #EDEAF2',
              cursor: 'pointer', background: '#fff', color: '#5B5470', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
            }}>수정</button>
            <button onClick={handleDelete} style={{
              height: 32, padding: '0 12px', borderRadius: 8, border: 'none',
              cursor: 'pointer', background: '#FEE2E2', color: '#EF4444', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
            }}>삭제</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <EventThumb imageUrl={event.imageUrl} title={event.title} active={event.active} tall />

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <Badge active={event.active}>{event.active ? '진행중' : '종료'}</Badge>
            {event.active && <Badge red>D-{event.dday <= 0 ? 'DAY' : event.dday}</Badge>}
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 20, color: '#1A1626', letterSpacing: '-0.4px', lineHeight: 1.3 }}>{event.title}</h1>
          <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 6 }}>{event.startDate} ~ {event.endDate}</p>

          <div style={{ height: 1, background: '#EDEAF2', margin: '16px 0' }} />
          <p style={{ fontSize: 14, color: '#5B5470', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{event.content}</p>
          <div style={{ height: 1, background: '#EDEAF2', margin: '20px 0 14px' }} />

          {/* 댓글 목록 */}
          <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626', marginBottom: 12 }}>
            댓글 <span style={{ color: '#7C3AED' }}>{comments.length}</span>
          </p>
          {comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#9B94AD', fontSize: 13 }}>
              첫 번째 댓글을 남겨보세요!
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {comments.map(c => (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', background: '#EDE7FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#7C3AED',
                    }}>{c.nickname?.[0]?.toUpperCase() || '?'}</div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1A1626' }}>{c.nickname}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#9B94AD' }}>
                      {new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                    {user && c.userId === user.id && (
                      <button onClick={() => handleReplyDelete(c.id)} style={{
                        fontSize: 11, color: '#C8C2D6', background: 'none', border: 'none',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>삭제</button>
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
      {event.dday < 0 ? (
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #EDEAF2', background: '#F7F5FA',
          textAlign: 'center', flexShrink: 0,
        }}>
          <p style={{ fontSize: 13, color: '#9B94AD', fontWeight: 600 }}>종료된 이벤트는 댓글을 작성할 수 없어요</p>
        </div>
      ) : !user ? (
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #EDEAF2', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <p style={{ fontSize: 13, color: '#9B94AD' }}>로그인 후 댓글을 남길 수 있어요</p>
          <button onClick={login} style={{
            fontSize: 13, fontWeight: 800, color: '#7C3AED', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>로그인 →</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          padding: '12px 16px', borderTop: '1px solid #EDEAF2', background: '#fff',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="댓글을 입력하세요..."
            style={{
              flex: 1, height: 44, padding: '0 14px', borderRadius: 12, fontFamily: 'inherit',
              border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, color: '#1A1626',
              background: '#F7F5FA', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#EDEAF2'}
          />
          <button type="submit" disabled={submitting || !content.trim()} style={{
            height: 44, padding: '0 18px', borderRadius: 12, border: 'none',
            cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
            background: submitting || !content.trim() ? '#EDEAF2' : '#7C3AED',
            color: submitting || !content.trim() ? '#9B94AD' : '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
          }}>등록</button>
        </form>
      )}
    </div>
  )
}

// ── 이벤트 등록/수정 폼 (admin only) ──────────────────────
function EventForm({ onClose, onCreated, initialData }) {
  const isEdit = !!initialData
  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    content: initialData?.content ?? '',
    imageUrl: initialData?.imageUrl ?? '',
    startDate: initialData?.startDate ?? '',
    endDate: initialData?.endDate ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const r = await uploadImage(file)
      set('imageUrl', r.data.url)
    } catch {
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim() || !form.startDate || !form.endDate) return
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        content: form.content,
        imageUrl: form.imageUrl || null,
        startDate: form.startDate,
        endDate: form.endDate,
      }
      const r = isEdit
        ? await updateEvent(initialData.id, payload)
        : await createEvent(payload)
      onCreated(r.data)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 48, padding: '0 14px', borderRadius: 12, fontFamily: 'inherit',
    border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 14, color: '#1A1626',
    background: '#F7F5FA', transition: 'border-color 0.15s', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,22,38,0.5)',
      zIndex: 50, display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '20px 20px 80px', maxHeight: 'calc(90dvh - 56px)', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 17, color: '#1A1626' }}>{isEdit ? '이벤트 수정' : '이벤트 등록'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9B94AD' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 6 }}>제목 *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="이벤트 제목" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 6 }}>내용 *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} placeholder="이벤트 내용을 입력하세요" required rows={4}
              style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 6 }}>이미지 (선택)</label>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} style={{ display: 'none' }} />
            {form.imageUrl ? (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid #EDEAF2' }}>
                <img src={form.imageUrl} alt="미리보기" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => set('imageUrl', '')} style={{
                  position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%',
                  border: 'none', cursor: 'pointer', background: 'rgba(26,22,38,0.55)',
                  color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            ) : (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 12, border: '1.5px dashed #C8C2D6',
                background: '#F7F5FA', cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {uploading ? (
                  <Spinner small />
                ) : (
                  <>
                    <span style={{ fontSize: 28, opacity: 0.4 }}>🖼️</span>
                    <span style={{ fontSize: 13, color: '#9B94AD', fontWeight: 600 }}>클릭하여 이미지 업로드</span>
                    <span style={{ fontSize: 11, color: '#C8C2D6' }}>JPG · PNG · WEBP · 최대 10MB</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 6 }}>시작일 *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 6 }}>종료일 *</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
            </div>
          </div>
          <button type="submit" disabled={submitting} style={{
            height: 52, borderRadius: 14, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
            color: submitting ? '#9B94AD' : '#fff', fontSize: 15, fontWeight: 800,
            fontFamily: 'inherit', marginTop: 4,
            boxShadow: submitting ? 'none' : '0 6px 16px rgba(124,58,237,0.28)',
          }}>
            {submitting ? (isEdit ? '수정 중...' : '등록 중...') : (isEdit ? '수정하기' : '등록하기')}
          </button>
        </form>
      </div>
    </div>
  )
}

function EventThumb({ imageUrl, title, active, tall }) {
  return (
    <div style={{
      width: '100%', aspectRatio: tall ? '2/1' : '16/9',
      background: active
        ? 'linear-gradient(135deg, #FF8FB1 0%, #9B6CFF 55%, #7C3AED 100%)'
        : 'linear-gradient(135deg, #C8C2D6, #9B94AD)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      {imageUrl
        ? <img src={imageUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.4 }}>🎁</div>
      }
    </div>
  )
}

function Badge({ children, active, red }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
      background: red ? '#FEE2E2' : active ? '#EDE7FF' : '#F7F5FA',
      color: red ? '#EF4444' : active ? '#7C3AED' : '#9B94AD',
    }}>{children}</span>
  )
}

function getDdayLabel(dday, active) {
  if (!active) return '종료'
  return dday <= 0 ? 'D-DAY' : `D-${dday}`
}

function Spinner({ small }) {
  const size = small ? 22 : 28
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: small ? 0 : 64 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        border: '2.5px solid #7C3AED', borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
