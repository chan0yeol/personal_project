import { useEffect, useState } from 'react'
import { getSpot, getReviews, createReview, deleteReview, uploadImage, toggleSpotLike, toggleReviewLike,
  getGatherings, getGathering, createGathering, deleteGathering, joinGathering, leaveGathering,
  getGatheringParticipants, getGatheringComments, createGatheringComment, deleteGatheringComment,
  updateSpot, suggestSpotEdit, getSpotVideos,
  getSpotGallery, getSpotTags, addSpotTag, deleteSpotTag } from '../api/spots'
import { useAuth } from '../context/AuthContext'
import ImageSlider from './ImageSlider'

const MAX_REVIEW_IMAGES = 3
const DIFFICULTY_LABEL = { EASY: '쉬움', NORMAL: '보통', HARD: '어려움' }
const DIFFICULTY_COLOR = { EASY: '#10B981', NORMAL: '#FBBF24', HARD: '#EF4444' }

export default function SpotPanel({ spotId, onClose }) {
  const { user, login } = useAuth()
  const [spot, setSpot] = useState(null)
  const [reviews, setReviews] = useState([])
  const [content, setContent] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('reviews')
  const [copyToast, setCopyToast] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showSuggestForm, setShowSuggestForm] = useState(false)
  const [reviewSort, setReviewSort] = useState('latest')
  const [tags, setTags] = useState([])
  // 선택 입력 항목
  const [rating, setRating] = useState(0)
  const [playCount, setPlayCount] = useState('')
  const [spendAmount, setSpendAmount] = useState('')
  const [catchResult, setCatchResult] = useState(null)
  const [machineCondition, setMachineCondition] = useState(null)
  const [revisit, setRevisit] = useState(null)

  const handleShare = () => {
    const url = `${window.location.origin}/?spotId=${spotId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopyToast(true)
      setTimeout(() => setCopyToast(false), 2000)
    })
  }

  useEffect(() => {
    getSpot(spotId).then(r => setSpot(r.data))
    getReviews(spotId).then(r => setReviews(r.data))
    getSpotTags(spotId).then(r => setTags(r.data)).catch(() => {})
  }, [spotId])

  const handleSpotLike = async () => {
    const { data } = await toggleSpotLike(spotId)
    setSpot(prev => ({ ...prev, liked: data.liked, likeCount: data.likeCount }))
  }

  const handleReviewLike = async (reviewId) => {
    const { data } = await toggleReviewLike(reviewId)
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, liked: data.liked, likeCount: data.likeCount } : r
    ))
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return
    await deleteReview(spotId, reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, MAX_REVIEW_IMAGES)
    setImageFiles(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const imageUrls = await Promise.all(
        imageFiles.map(file => uploadImage(file).then(r => r.data.url))
      )
      const reviewNickname = user ? (user.nickname || '익명') : '익명'
      await createReview(spotId, {
        nickname: reviewNickname, content, imageUrls,
        rating: rating || null,
        playCount: playCount ? Number(playCount) : null,
        spendAmount: spendAmount ? Number(spendAmount) : null,
        catchResult: catchResult || null,
        machineCondition: machineCondition || null,
        revisit: revisit,
      })
      const r = await getReviews(spotId)
      setReviews(r.data)
      setContent('')
      setImageFiles([])
      setPreviews([])
      setRating(0); setPlayCount(''); setSpendAmount('')
      setCatchResult(null); setMachineCondition(null); setRevisit(null)
    } finally {
      setSubmitting(false)
    }
  }

  if (!spot) return (
    <div style={{
      position: 'fixed', bottom: 64, left: 0, right: 0, height: '82dvh',
      background: '#fff', zIndex: 10, display: 'flex', alignItems: 'center',
      justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2.5px solid #7C3AED', borderTopColor: 'transparent',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', bottom: 64, left: 0, right: 0, height: '82dvh',
      background: '#fff', zIndex: 10, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', borderTopLeftRadius: 24, borderTopRightRadius: 24,
      boxShadow: '0 -4px 24px rgba(31,17,68,0.12)',
    }}>

      {/* 드래그 핸들 */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#E2DDEC' }} />
      </div>

      {/* 이미지 슬라이더 */}
      {spot.imageUrls?.length > 0 && <ImageSlider urls={spot.imageUrls} />}

      {/* 스팟 헤더 */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontWeight: 800, fontSize: 18, color: '#1A1626', letterSpacing: '-0.4px', lineHeight: 1.3 }}>
            {spot.name}
          </h2>
          <p style={{ color: '#9B94AD', fontSize: 13, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {spot.address}
          </p>
          {user && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {spot.userId === user.id ? (
                <button onClick={() => setShowEditForm(true)} style={{
                  height: 24, padding: '0 10px', borderRadius: 6, border: '1.5px solid #EDEAF2',
                  background: '#fff', fontSize: 11, fontWeight: 700, color: '#5B5470', cursor: 'pointer', fontFamily: 'inherit',
                }}>수정</button>
              ) : (
                <button onClick={() => setShowSuggestForm(true)} style={{
                  height: 24, padding: '0 10px', borderRadius: 6, border: '1.5px solid #EDEAF2',
                  background: '#fff', fontSize: 11, fontWeight: 700, color: '#5B5470', cursor: 'pointer', fontFamily: 'inherit',
                }}>수정 제안</button>
              )}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* 공유 버튼 */}
          <button onClick={handleShare} style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#F7F5FA', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="#9B94AD" strokeWidth="2"/>
              <circle cx="6" cy="12" r="3" stroke="#9B94AD" strokeWidth="2"/>
              <circle cx="18" cy="19" r="3" stroke="#9B94AD" strokeWidth="2"/>
              <path d="M8.7 13.5l6.6 4M15.3 6.5l-6.6 4" stroke="#9B94AD" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {/* 찜 버튼 */}
          <button onClick={handleSpotLike} style={{
            width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: spot.liked ? '#FFE5EE' : '#F7F5FA',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            transition: 'all 0.15s',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={spot.liked ? '#FF6B9D' : 'none'}>
              <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"
                stroke={spot.liked ? '#FF6B9D' : '#C8C2D6'} strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 700, color: spot.liked ? '#FF6B9D' : '#9B94AD' }}>
              {spot.likeCount}
            </span>
          </button>
          {/* 닫기 버튼 */}
          <button onClick={onClose} style={{
            width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#F7F5FA', color: '#9B94AD', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}>✕</button>
        </div>
      </div>

      {/* 정보 태그 */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
        {spot.openTime && <InfoChip>{`⏰ ${spot.openTime}`}</InfoChip>}
        {spot.coin500 && <InfoChip>🪙 500원</InfoChip>}
        {spot.coin1000 && <InfoChip>💴 1000원</InfoChip>}
        {spot.parking && <InfoChip>🅿️ 주차가능</InfoChip>}
        {spot.difficulty && (
          <InfoChip color={DIFFICULTY_COLOR[spot.difficulty]}>
            🎯 {DIFFICULTY_LABEL[spot.difficulty]}
          </InfoChip>
        )}
      </div>

      {/* 태그 섹션 */}
      <TagSection
        spotId={spotId} tags={tags} user={user}
        onAdd={(tag) => setTags(prev => [...prev, tag])}
        onDelete={(tagId) => setTags(prev => prev.filter(t => t.id !== tagId))}
      />

      {/* 길찾기 버튼 */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8, flexShrink: 0 }}>
        <a href={`https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lng}`}
          target="_blank" rel="noreferrer" style={{
            flex: 1, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, fontSize: 12, fontWeight: 800, color: '#1A1626', textDecoration: 'none',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"
              fill="#1A1626"/>
          </svg>
          카카오맵
        </a>
        <a href={`https://map.naver.com/v5/search/${encodeURIComponent(spot.name + ' ' + spot.address)}`}
          target="_blank" rel="noreferrer" style={{
            flex: 1, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
            background: '#03C75A', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 5, fontSize: 12, fontWeight: 800, color: '#fff', textDecoration: 'none',
          }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"
              fill="#fff"/>
          </svg>
          네이버지도
        </a>
      </div>

      {/* 복사 토스트 */}
      {copyToast && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#1A1626', color: '#fff', fontSize: 13, fontWeight: 700,
          padding: '8px 18px', borderRadius: 999, zIndex: 20, whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>링크가 복사되었어요</div>
      )}

      <div style={{ height: 1, background: '#EDEAF2', margin: '0 20px', flexShrink: 0 }} />

      {/* 탭 바 */}
      <div style={{ display: 'flex', padding: '0 20px', gap: 4, flexShrink: 0, borderBottom: '1px solid #EDEAF2' }}>
        {[{ id: 'reviews', label: '후기' }, { id: 'photos', label: '사진' }, { id: 'gatherings', label: '모임' }, { id: 'videos', label: '영상' }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 14px', border: 'none', cursor: 'pointer', background: 'transparent',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
            color: activeTab === tab.id ? '#7C3AED' : '#9B94AD',
            borderBottom: activeTab === tab.id ? '2px solid #7C3AED' : '2px solid transparent',
            transition: 'all 0.15s', marginBottom: -1,
          }}>{tab.label}</button>
        ))}
      </div>

      {/* 사진 탭 */}
      {activeTab === 'photos' && (
        <PhotoTab spotId={spotId} />
      )}

      {/* 모임 탭 */}
      {activeTab === 'gatherings' && (
        <GatheringTab spotId={spotId} user={user} login={login} />
      )}

      {/* 영상 탭 */}
      {activeTab === 'videos' && (
        <SpotVideoTab spotId={spotId} />
      )}

      {/* 수정/제안 폼 */}
      {showEditForm && (
        <SpotEditForm spot={spot} onClose={() => setShowEditForm(false)} onSaved={(updated) => {
          setSpot(prev => ({ ...prev, ...updated }))
          setShowEditForm(false)
        }} />
      )}
      {showSuggestForm && (
        <SpotSuggestForm spotId={spot.id} onClose={() => setShowSuggestForm(false)} />
      )}

      {/* 리뷰 목록 + 작성 폼 (하나의 스크롤 영역) */}
      {activeTab === 'reviews' && <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626' }}>
            후기 <span style={{ color: '#7C3AED' }}>{reviews.length}</span>
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ id: 'latest', label: '최신순' }, { id: 'likes', label: '공감순' }].map(s => (
              <button key={s.id} onClick={() => setReviewSort(s.id)} style={{
                height: 26, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                background: reviewSort === s.id ? '#7C3AED' : '#F7F5FA',
                color: reviewSort === s.id ? '#fff' : '#9B94AD',
                transition: 'all 0.15s',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {reviews.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8, color: '#9B94AD' }}>
            <span style={{ fontSize: 32 }}>💬</span>
            <p style={{ fontSize: 14, fontWeight: 600 }}>아직 후기가 없어요</p>
            <p style={{ fontSize: 12 }}>첫 번째 후기를 남겨보세요!</p>
          </div>
        )}

        <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...reviews]
            .sort((a, b) => reviewSort === 'likes' ? b.likeCount - a.likeCount : 0)
            .map(r => (
              <ReviewCard key={r.id} r={r} user={user} onLike={handleReviewLike} onDelete={handleDeleteReview} />
            ))}
        </div>

        {/* 후기 작성 영역 — 스크롤 영역 안에 포함 */}
        <div style={{ margin: '0 20px 8px', height: 1, background: '#EDEAF2' }} />
        {!user ? (
          <div style={{ padding: '16px 20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, color: '#9B94AD', fontWeight: 500 }}>로그인 후 후기를 남길 수 있어요</p>
            <button onClick={login} style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>로그인 →</button>
          </div>
        ) : (
        <form onSubmit={handleReviewSubmit} style={{
          padding: '14px 20px 28px',
          display: 'flex', flexDirection: 'column', gap: 10, background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={user.profileImageUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5B5470' }}>{user.nickname}</span>
            <span style={{ fontSize: 12, color: '#9B94AD' }}>으로 작성</span>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="이 뽑기방 어떠셨나요? 솔직한 후기를 남겨주세요 😊"
            rows={2}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12, resize: 'none',
              border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, fontFamily: 'inherit',
              background: '#F7F5FA', color: '#1A1626', lineHeight: 1.6,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#EDEAF2'}
          />

          {/* 별점 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600, minWidth: 44 }}>별점</span>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setRating(rating === n ? 0 : n)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 20,
                  color: n <= rating ? '#FBBF24' : '#E5E7EB', transition: 'color 0.1s',
                }}>★</button>
              ))}
            </div>
          </div>

          {/* 뽑기 결과 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600, minWidth: 44 }}>결과</span>
            <ToggleGroup
              value={catchResult}
              onChange={setCatchResult}
              options={[{ value: 'SUCCESS', label: '🎉 성공' }, { value: 'CLOSE', label: '😅 아슬아슬' }, { value: 'FAIL', label: '😢 실패' }]}
            />
          </div>

          {/* 판 수 / 금액 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600, minWidth: 44 }}>기록</span>
            <input type="number" min={1} value={playCount} onChange={e => setPlayCount(e.target.value)}
              placeholder="판 수" style={{ width: 64, height: 32, padding: '0 8px', borderRadius: 8, border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 12, fontFamily: 'inherit', background: '#F7F5FA', textAlign: 'center' }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
            <span style={{ fontSize: 12, color: '#9B94AD' }}>판</span>
            <input type="number" min={0} step={500} value={spendAmount} onChange={e => setSpendAmount(e.target.value)}
              placeholder="금액" style={{ width: 72, height: 32, padding: '0 8px', borderRadius: 8, border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 12, fontFamily: 'inherit', background: '#F7F5FA', textAlign: 'center' }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
            <span style={{ fontSize: 12, color: '#9B94AD' }}>원</span>
          </div>

          {/* 기계 컨디션 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600, minWidth: 44 }}>기계</span>
            <ToggleGroup
              value={machineCondition}
              onChange={setMachineCondition}
              options={[{ value: 'GOOD', label: '좋음' }, { value: 'NORMAL', label: '보통' }, { value: 'BAD', label: '나쁨' }]}
            />
          </div>

          {/* 재방문 의사 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600, minWidth: 44 }}>재방문</span>
            <ToggleGroup
              value={revisit === null ? null : revisit ? 'YES' : 'NO'}
              onChange={v => setRevisit(v === null ? null : v === 'YES')}
              options={[{ value: 'YES', label: '🔄 갈래요' }, { value: 'NO', label: '👋 글쎄요' }]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9B94AD', cursor: 'pointer', fontWeight: 600 }}>
              <span>📷</span>
              <span>{previews.length > 0 ? `${previews.length}장 선택됨` : '사진 추가'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageChange} />
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {previews.map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting || !content.trim()} style={{
            width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
            background: submitting || !content.trim() ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
            color: submitting || !content.trim() ? '#9B94AD' : '#fff',
            fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            boxShadow: submitting || !content.trim() ? 'none' : '0 6px 16px rgba(124,58,237,0.28)',
            transition: 'all 0.15s',
          }}>
            {submitting ? '등록 중...' : '후기 등록'}
          </button>
        </form>
        )}
      </div>}
    </div>
  )
}

// ── 모임 탭 ──────────────────────────────────────────
function GatheringTab({ spotId, user, login }) {
  const [gatherings, setGatherings] = useState(null)
  const [selected, setSelected] = useState(null) // 상세 보기 중인 모임 id
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getGatherings(spotId).then(r => setGatherings(r.data)).catch(() => setGatherings([]))
  }, [spotId])

  const handleJoin = async (id) => {
    const { data } = await joinGathering(id)
    setGatherings(prev => prev.map(g => g.id === id ? data : g))
  }

  const handleLeave = async (id) => {
    await leaveGathering(id)
    const { data } = await getGatherings(spotId).then(r => r)
    setGatherings(data.data)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('모임을 취소할까요?')) return
    await deleteGathering(id)
    setGatherings(prev => prev.filter(g => g.id !== id))
    if (selected === id) setSelected(null)
  }

  if (selected) {
    return (
      <GatheringDetail
        gatheringId={selected}
        user={user}
        login={login}
        onBack={() => setSelected(null)}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: '#1A1626' }}>
          모임 <span style={{ color: '#7C3AED' }}>{gatherings?.length ?? ''}</span>
        </p>
        {user && (
          <button onClick={() => setShowForm(true)} style={{
            height: 30, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
          }}>＋ 모임 만들기</button>
        )}
      </div>

      {gatherings === null && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {gatherings?.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 8, color: '#9B94AD' }}>
          <span style={{ fontSize: 32 }}>👥</span>
          <p style={{ fontSize: 14, fontWeight: 600 }}>아직 모임이 없어요</p>
          {user
            ? <p style={{ fontSize: 12 }}>첫 번째 모임을 만들어보세요!</p>
            : <button onClick={login} style={{ fontSize: 13, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>로그인 →</button>
          }
        </div>
      )}

      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gatherings?.map(g => (
          <GatheringCard key={g.id} gathering={g} onClick={() => setSelected(g.id)} />
        ))}
      </div>

      {showForm && (
        <GatheringForm
          spotId={spotId}
          onClose={() => setShowForm(false)}
          onCreated={(g) => {
            setGatherings(prev => [g, ...prev])
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function GatheringCard({ gathering: g, onClick }) {
  const isPast = new Date(g.meetAt) < new Date()
  const effectiveStatus = isPast && g.status === 'OPEN' ? 'ENDED' : g.status
  const statusLabel = { OPEN: '모집중', CLOSED: '마감', CANCELLED: '취소', ENDED: '종료' }
  const statusColor = { OPEN: '#7C3AED', CLOSED: '#9B94AD', CANCELLED: '#EF4444', ENDED: '#9B94AD' }
  const statusBg   = { OPEN: '#EDE7FF', CLOSED: '#F7F5FA', CANCELLED: '#FEE2E2', ENDED: '#F7F5FA' }

  return (
    <button onClick={onClick} style={{
      width: '100%', background: '#F7F5FA', borderRadius: 14, padding: '14px 16px',
      border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s',
      opacity: isPast || g.status === 'CANCELLED' ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
          background: statusBg[effectiveStatus], color: statusColor[effectiveStatus],
        }}>{statusLabel[effectiveStatus]}</span>
        {g.isRecurring && <span style={{ fontSize: 11, color: '#9B94AD', fontWeight: 600 }}>🔄 정기</span>}
      </div>
      <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626', marginBottom: 4 }}>{g.title}</p>
      <p style={{ fontSize: 12, color: '#9B94AD' }}>
        📅 {new Date(g.meetAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        &nbsp;·&nbsp;
        👥 {g.participantCount}{g.maxParticipants ? `/${g.maxParticipants}` : ''}명
      </p>
    </button>
  )
}

function GatheringDetail({ gatheringId, user, login, onBack, onJoin, onLeave, onDelete }) {
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
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  const isPast = new Date(gathering.meetAt) < new Date()
  const isFull = gathering.maxParticipants && gathering.participantCount >= gathering.maxParticipants

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 상세 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid #EDEAF2', flexShrink: 0 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: '#F7F5FA', color: '#5B5470', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
        <p style={{ flex: 1, fontWeight: 700, fontSize: 14, color: '#1A1626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gathering.title}</p>
        {gathering.host && (
          <button onClick={() => onDelete(gatheringId)} style={{ height: 28, padding: '0 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', color: '#EF4444', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>취소</button>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {/* 모임 정보 */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EDEAF2' }}>
          <p style={{ fontSize: 13, color: '#5B5470', lineHeight: 1.7, marginBottom: 10 }}>{gathering.description}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={{ fontSize: 12, color: '#9B94AD' }}>📅 {new Date(gathering.meetAt).toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p style={{ fontSize: 12, color: '#9B94AD' }}>👤 개설자: {gathering.hostNickname}</p>
            <p style={{ fontSize: 12, color: '#9B94AD' }}>👥 {gathering.participantCount}{gathering.maxParticipants ? `/${gathering.maxParticipants}` : ''}명 참여중{gathering.isRecurring ? ` · 🔄 정기모임` : ''}</p>
          </div>

          {/* 참여/나가기 버튼 */}
          {isPast && (
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#9B94AD', fontWeight: 600 }}>
              종료된 모임입니다
            </div>
          )}
          {user && !gathering.host && gathering.status === 'OPEN' && !isPast && (
            <button
              onClick={() => gathering.joined ? handleLeaveClick() : handleJoinClick()}
              disabled={!gathering.joined && isFull}
              style={{
                marginTop: 12, width: '100%', height: 40, borderRadius: 10, border: 'none',
                cursor: isFull && !gathering.joined ? 'not-allowed' : 'pointer',
                background: gathering.joined ? '#FEE2E2' : isFull ? '#EDEAF2' : '#7C3AED',
                color: gathering.joined ? '#EF4444' : isFull ? '#9B94AD' : '#fff',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {gathering.joined ? '참여 취소' : isFull ? '정원 마감' : '참여하기'}
            </button>
          )}
          {!user && (
            <button onClick={login} style={{ marginTop: 12, width: '100%', height: 40, borderRadius: 10, border: '1.5px solid #EDEAF2', cursor: 'pointer', background: '#fff', color: '#7C3AED', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>로그인 후 참여</button>
          )}
        </div>

        {/* 참여자 목록 */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #EDEAF2' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#1A1626', marginBottom: 8 }}>참여자 {participants.length}명</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {participants.map(p => (
              <div key={p.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {p.profileImageUrl
                  ? <img src={p.profileImageUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EDE7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>{p.nickname?.[0]?.toUpperCase()}</div>
                }
                <span style={{ fontSize: 10, color: '#9B94AD', maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nickname}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 댓글 */}
        <div style={{ padding: '12px 16px' }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: '#1A1626', marginBottom: 8 }}>댓글 {comments.length}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {comments.map(c => (
              <div key={c.id} style={{ background: '#F7F5FA', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1626' }}>{c.nickname}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#C8C2D6' }}>{new Date(c.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                    {user?.id === c.userId && (
                      <button onClick={() => handleDeleteComment(c.id)} style={{ fontSize: 10, color: '#C8C2D6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#5B5470', lineHeight: 1.5 }}>{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 댓글 입력 */}
      {isPast ? (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #EDEAF2', background: '#F7F5FA', textAlign: 'center', flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: '#9B94AD', fontWeight: 600 }}>종료된 모임은 댓글을 작성할 수 없어요</p>
        </div>
      ) : user ? (
        <form onSubmit={handleComment} style={{ padding: '10px 16px', borderTop: '1px solid #EDEAF2', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input value={content} onChange={e => setContent(e.target.value)} placeholder="댓글을 입력하세요..."
            style={{ flex: 1, height: 40, padding: '0 12px', borderRadius: 10, border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: '#F7F5FA' }}
            onFocus={e => e.target.style.borderColor = '#7C3AED'}
            onBlur={e => e.target.style.borderColor = '#EDEAF2'}
          />
          <button type="submit" disabled={submitting || !content.trim()} style={{
            height: 40, padding: '0 14px', borderRadius: 10, border: 'none',
            cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
            background: submitting || !content.trim() ? '#EDEAF2' : '#7C3AED',
            color: submitting || !content.trim() ? '#9B94AD' : '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          }}>등록</button>
        </form>
      ) : (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #EDEAF2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 12, color: '#9B94AD' }}>로그인 후 댓글을 남길 수 있어요</p>
          <button onClick={login} style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>로그인 →</button>
        </div>
      )}
    </div>
  )
}

function GatheringForm({ spotId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', meetAt: '', maxParticipants: '',
    isRecurring: false, recurrenceType: '', recurrenceDay: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await createGathering({
        spotId,
        title: form.title,
        description: form.description || null,
        meetAt: form.meetAt,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
        isRecurring: form.isRecurring,
        recurrenceType: form.isRecurring && form.recurrenceType ? form.recurrenceType : null,
        recurrenceDay: form.isRecurring && form.recurrenceDay ? Number(form.recurrenceDay) : null,
      })
      onCreated(r.data)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 44, padding: '0 12px', borderRadius: 10, fontFamily: 'inherit',
    border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, color: '#1A1626',
    background: '#F7F5FA', transition: 'border-color 0.15s', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,38,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '18px 18px 80px', maxHeight: 'calc(90dvh - 56px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>모임 만들기</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9B94AD' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>제목 *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="모임 제목" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>설명</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="모임 설명 (선택)" rows={2}
              style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'none', lineHeight: 1.5 }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>모임 일시 *</label>
            <input type="datetime-local" value={form.meetAt} onChange={e => set('meetAt', e.target.value)} required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 5 }}>최대 인원 (미입력 시 무제한)</label>
            <input type="number" min={2} value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} placeholder="인원 제한 없음" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isRecurring} onChange={e => set('isRecurring', e.target.checked)} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#5B5470' }}>정기 모임</span>
          </label>
          {form.isRecurring && (
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={form.recurrenceType} onChange={e => set('recurrenceType', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="">주기 선택</option>
                <option value="WEEKLY">매주</option>
                <option value="MONTHLY">매월</option>
              </select>
              <input type="number" min={0} max={31} value={form.recurrenceDay} onChange={e => set('recurrenceDay', e.target.value)}
                placeholder={form.recurrenceType === 'WEEKLY' ? '요일(0=일)' : '날짜(1~31)'}
                style={{ ...inputStyle, flex: 1 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'} />
            </div>
          )}
          <button type="submit" disabled={submitting} style={{
            height: 48, borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
            color: submitting ? '#9B94AD' : '#fff', fontSize: 14, fontWeight: 800,
            fontFamily: 'inherit', marginTop: 4,
            boxShadow: submitting ? 'none' : '0 4px 14px rgba(124,58,237,0.28)',
          }}>
            {submitting ? '만드는 중...' : '모임 만들기'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── 스팟 영상 탭 ──────────────────────────────────────
function SpotVideoTab({ spotId }) {
  const [videos, setVideos] = useState(null)

  useEffect(() => {
    getSpotVideos(spotId).then(r => setVideos(r.data)).catch(() => setVideos([]))
  }, [spotId])

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {videos === null && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
        </div>
      )}
      {videos?.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 8, color: '#9B94AD' }}>
          <span style={{ fontSize: 32 }}>🎬</span>
          <p style={{ fontSize: 14, fontWeight: 600 }}>이 뽑기방의 영상이 없어요</p>
        </div>
      )}
      {videos?.map(video => (
        <a key={video.id} href={video.youtubeUrl} target="_blank" rel="noreferrer" style={{
          display: 'flex', gap: 10, background: '#F7F5FA', borderRadius: 12,
          overflow: 'hidden', textDecoration: 'none',
        }}>
          <div style={{ width: 100, flexShrink: 0, position: 'relative', background: '#1A1626' }}>
            <img src={video.thumbnailUrl} alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { e.target.style.display = 'none' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF0000"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, padding: '10px 10px 10px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#1A1626', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {video.title}
            </p>
            <p style={{ fontSize: 11, color: '#7C3AED', fontWeight: 600, marginTop: 4 }}>유튜브에서 보기 →</p>
          </div>
        </a>
      ))}
    </div>
  )
}

// ── 리뷰 카드 ──────────────────────────────────────────
const CATCH_LABEL = { SUCCESS: '🎉 성공', CLOSE: '😅 아슬아슬', FAIL: '😢 실패' }
const CATCH_COLOR = { SUCCESS: '#10B981', CLOSE: '#FBBF24', FAIL: '#EF4444' }
const CONDITION_LABEL = { GOOD: '기계 좋음', NORMAL: '기계 보통', BAD: '기계 나쁨' }
const CONDITION_COLOR = { GOOD: '#10B981', NORMAL: '#FBBF24', BAD: '#EF4444' }

function ReviewCard({ r, user, onLike, onDelete }) {
  const isBest = r.rating >= 4 && r.likeCount >= 3
  return (
    <div style={{ background: isBest ? '#F6F2FF' : '#F7F5FA', borderRadius: 16, padding: 16, border: isBest ? '1.5px solid #EDE7FF' : 'none' }}>
      {/* 베스트 뱃지 */}
      {isBest && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', background: '#EDE7FF', padding: '2px 8px', borderRadius: 6 }}>🏆 베스트 후기</span>
        </div>
      )}
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {r.profileImageUrl
            ? <img src={r.profileImageUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EDE7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>{r.nickname?.[0]?.toUpperCase() || '?'}</div>
          }
          <div>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#1A1626' }}>{r.nickname}</span>
            {r.rating > 0 && (
              <span style={{ marginLeft: 6, fontSize: 12, color: '#FBBF24' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            )}
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#9B94AD' }}>
          {new Date(r.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* 선택 항목 칩 */}
      {(r.catchResult || r.playCount || r.spendAmount || r.machineCondition || r.revisit !== null) && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
          {r.catchResult && <MetaChip color={CATCH_COLOR[r.catchResult]}>{CATCH_LABEL[r.catchResult]}</MetaChip>}
          {(r.playCount || r.spendAmount) && (
            <MetaChip color="#6D28D9">
              {r.playCount ? `${r.playCount}판` : ''}{r.playCount && r.spendAmount ? ' · ' : ''}{r.spendAmount ? `${r.spendAmount.toLocaleString()}원` : ''}
            </MetaChip>
          )}
          {r.machineCondition && <MetaChip color={CONDITION_COLOR[r.machineCondition]}>{CONDITION_LABEL[r.machineCondition]}</MetaChip>}
          {r.revisit === true  && <MetaChip color="#10B981">🔄 재방문 예정</MetaChip>}
          {r.revisit === false && <MetaChip color="#9B94AD">👋 재방문 글쎄요</MetaChip>}
        </div>
      )}

      <p style={{ fontSize: 13, color: '#5B5470', lineHeight: 1.6 }}>{r.content}</p>

      {r.imageUrls?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {r.imageUrls.map((url, i) => (
            <img key={i} src={url} alt="" onClick={() => window.open(url, '_blank')}
              style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, cursor: 'pointer' }} />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <button onClick={() => onLike(r.id)} style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
          padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
          background: r.liked ? '#EDE7FF' : '#fff', color: r.liked ? '#7C3AED' : '#9B94AD',
          transition: 'all 0.15s', fontFamily: 'inherit',
        }}>👍 {r.likeCount}</button>
        {user && r.userId === user.id && (
          <button onClick={() => onDelete(r.id)} style={{ fontSize: 12, color: '#C8C2D6', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
        )}
      </div>
    </div>
  )
}

function MetaChip({ children, color }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      background: `${color}18`, color,
    }}>{children}</span>
  )
}

function ToggleGroup({ value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map(opt => (
        <button key={opt.value} type="button"
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          style={{
            height: 28, padding: '0 10px', borderRadius: 8, fontFamily: 'inherit',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            border: value === opt.value ? 'none' : '1.5px solid #EDEAF2',
            background: value === opt.value ? '#7C3AED' : '#F7F5FA',
            color: value === opt.value ? '#fff' : '#9B94AD',
          }}
        >{opt.label}</button>
      ))}
    </div>
  )
}

// ── 스팟 수정 폼 ──────────────────────────────────────
function SpotEditForm({ spot, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: spot.name, address: spot.address, openTime: spot.openTime ?? '',
    parking: spot.parking ?? false, coin500: spot.coin500 ?? false,
    coin1000: spot.coin1000 ?? false, difficulty: spot.difficulty ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const r = await updateSpot(spot.id, { ...form, lat: spot.lat, lng: spot.lng, imageUrls: [] })
      onSaved(r.data)
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = { width: '100%', height: 44, padding: '0 12px', borderRadius: 10, border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: '#F7F5FA', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,38,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '18px 18px 80px', maxHeight: 'calc(90dvh - 56px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>스팟 수정</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9B94AD' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 4 }}>상호명 *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} /></div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 4 }}>영업시간</label>
            <input value={form.openTime} onChange={e => set('openTime', e.target.value)} placeholder="예: 10:00 ~ 22:00" style={inputStyle} /></div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[['parking', '주차가능'], ['coin500', '500원'], ['coin1000', '1000원']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#5B5470', fontWeight: 600 }}>
                <input type="checkbox" checked={!!form[key]} onChange={e => set(key, e.target.checked)} />{label}
              </label>
            ))}
          </div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: '#9B94AD', display: 'block', marginBottom: 4 }}>난이도</label>
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)} style={inputStyle}>
              <option value="">선택</option>
              <option value="EASY">쉬움</option><option value="NORMAL">보통</option><option value="HARD">어려움</option>
            </select></div>
          <button type="submit" disabled={submitting} style={{
            height: 48, borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            background: submitting ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
            color: submitting ? '#9B94AD' : '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', marginTop: 4,
          }}>{submitting ? '저장 중...' : '저장하기'}</button>
        </form>
      </div>
    </div>
  )
}

// ── 수정 제안 폼 ──────────────────────────────────────
function SpotSuggestForm({ spotId, onClose }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await suggestSpotEdit(spotId, content)
      setDone(true)
      setTimeout(onClose, 1500)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,38,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: '18px 18px 80px', maxHeight: 'calc(90dvh - 56px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: '#1A1626' }}>수정 제안</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9B94AD' }}>✕</button>
        </div>
        {done ? (
          <p style={{ textAlign: 'center', padding: '20px 0', fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>제안이 접수되었어요 ✓</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4}
              placeholder="수정이 필요한 내용을 알려주세요 (예: 영업시간이 10시~22시로 바뀌었어요)"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, resize: 'none', border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 13, fontFamily: 'inherit', background: '#F7F5FA', lineHeight: 1.6, boxSizing: 'border-box' }} />
            <button type="submit" disabled={submitting || !content.trim()} style={{
              height: 48, borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting || !content.trim() ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
              color: submitting || !content.trim() ? '#9B94AD' : '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            }}>{submitting ? '제출 중...' : '제안 보내기'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

function InfoChip({ children, color }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
      background: color ? `${color}18` : '#F6F2FF',
      color: color ?? '#6D28D9',
    }}>
      {children}
    </span>
  )
}

// ── 인형 태그 섹션 ────────────────────────────────────
const PRESET_TAGS = ['산리오', '포켓몬', '디즈니', '마블', 'BTS', '캐릭터']

function TagSection({ spotId, tags, user, onAdd, onDelete }) {
  const [showInput, setShowInput] = useState(false)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async (tag) => {
    const t = tag.trim()
    if (!t || t.length > 20) return
    setAdding(true)
    try {
      const r = await addSpotTag(spotId, t)
      if (r.status === 200) onAdd(r.data)
    } catch (e) {
      if (e.response?.status === 409) alert('이미 등록된 태그예요')
    } finally {
      setAdding(false)
      setInput('')
      setShowInput(false)
    }
  }

  if (tags.length === 0 && !user) return null

  return (
    <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {tags.map(t => (
          <span key={t.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
            background: '#EDE7FF', color: '#7C3AED',
          }}>
            🧸 {t.tag}
            {user && (t.userId === user.id || user.admin) && (
              <button onClick={() => onDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: '#9B6CFF', padding: 0, lineHeight: 1 }}>✕</button>
            )}
          </span>
        ))}
        {user && !showInput && (
          <button onClick={() => setShowInput(true)} style={{
            height: 24, padding: '0 10px', borderRadius: 999, border: '1.5px dashed #C4B8E8',
            background: 'transparent', color: '#9B6CFF', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>＋ 태그</button>
        )}
      </div>
      {showInput && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
            {PRESET_TAGS.map(p => (
              <button key={p} type="button" onMouseDown={() => handleAdd(p)} style={{
                height: 26, padding: '0 10px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: '#F6F2FF', color: '#7C3AED', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              }}>{p}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(input) } }}
              placeholder="직접 입력 (최대 20자)"
              maxLength={20}
              style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 12, fontFamily: 'inherit', background: '#F7F5FA' }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'} onBlur={e => e.target.style.borderColor = '#EDEAF2'}
            />
            <button onClick={() => handleAdd(input)} disabled={adding || !input.trim()} style={{
              height: 34, padding: '0 12px', borderRadius: 8, border: 'none',
              background: adding || !input.trim() ? '#EDEAF2' : '#7C3AED',
              color: adding || !input.trim() ? '#9B94AD' : '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>추가</button>
            <button onClick={() => { setShowInput(false); setInput('') }} style={{
              height: 34, padding: '0 10px', borderRadius: 8, border: 'none',
              background: '#F7F5FA', color: '#9B94AD', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>취소</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 사진 갤러리 탭 ────────────────────────────────────
function PhotoTab({ spotId }) {
  const [images, setImages] = useState(null)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    getSpotGallery(spotId).then(r => setImages(r.data)).catch(() => setImages([]))
  }, [spotId])

  if (images === null) return (
    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  if (images.length === 0) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#9B94AD' }}>
      <span style={{ fontSize: 32 }}>📸</span>
      <p style={{ fontSize: 14, fontWeight: 600 }}>아직 사진이 없어요</p>
    </div>
  )

  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setLightbox(i)} style={{ aspectRatio: '1', border: 'none', padding: 0, cursor: 'pointer', borderRadius: 8, overflow: 'hidden', position: 'relative', background: '#F7F5FA' }}>
              <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none' }} />
              {img.type === 'REVIEW' && (
                <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 9, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 5px', borderRadius: 4, fontWeight: 700 }}>리뷰</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(null)}>
          <button style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)) }}>‹</button>
          <img src={images[lightbox]?.url} alt="" style={{ maxWidth: '90vw', maxHeight: '85dvh', objectFit: 'contain', borderRadius: 8 }} onClick={e => e.stopPropagation()} />
          <button style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => { e.stopPropagation(); setLightbox(Math.min(images.length - 1, lightbox + 1)) }}>›</button>
          <button style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setLightbox(null)}>✕</button>
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{lightbox + 1} / {images.length}</div>
        </div>
      )}
    </>
  )
}
