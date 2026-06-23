import { useState, useEffect } from 'react'
import { createSpot, uploadImage } from '../api/spots'

const MAX_IMAGES = 5
const DIFFICULTY_OPTIONS = [
  { val: 'EASY', label: '쉬움', color: '#10B981' },
  { val: 'NORMAL', label: '보통', color: '#FBBF24' },
  { val: 'HARD', label: '어려움', color: '#EF4444' },
]

export default function SpotForm({ position, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', address: '', openTime: '',
    parking: false, coin500: false, coin1000: false, difficulty: 'NORMAL',
  })
  const [imageFiles, setImageFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  useEffect(() => {
    if (!position) return
    setGeocoding(true)
    const geocoder = new window.kakao.maps.services.Geocoder()
    geocoder.coord2Address(position.lng, position.lat, (result, status) => {
      setGeocoding(false)
      if (status === window.kakao.maps.services.Status.OK) {
        const addr = result[0].road_address?.address_name
          || result[0].address?.address_name || ''
        set('address', addr)
      }
    })
  }, [position])

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, MAX_IMAGES)
    setImageFiles(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const removeImage = (idx) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim()) return
    setUploading(true)
    try {
      const imageUrls = await Promise.all(
        imageFiles.map(file => uploadImage(file).then(r => r.data.url))
      )
      await createSpot({ ...form, lat: position.lat, lng: position.lng, imageUrls })
      onCreated()
      onClose()
    } finally {
      setUploading(false)
    }
  }

  const inputStyle = {
    width: '100%', height: 52, padding: '0 16px', borderRadius: 12, fontFamily: 'inherit',
    border: '1.5px solid #EDEAF2', outline: 'none', fontSize: 14, color: '#1A1626',
    background: '#fff', transition: 'border-color 0.15s',
  }

  const sectionStyle = {
    background: '#fff', borderRadius: 16, padding: 16,
    boxShadow: '0 1px 4px rgba(31,17,68,0.06)',
  }

  return (
    <div style={{
      position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100vw - 2rem)', maxWidth: 384,
      maxHeight: 'calc(100% - 2rem)', overflowY: 'auto',
      background: '#F7F5FA', borderRadius: 20,
      boxShadow: '0 16px 48px rgba(31,17,68,0.18)',
      zIndex: 20,
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '18px 20px 14px',
        background: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
        borderBottom: '1px solid #EDEAF2',
      }}>
        <button onClick={onClose} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#F7F5FA', color: '#9B94AD', fontSize: 16, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <h2 style={{ flex: 1, textAlign: 'center', fontWeight: 800, fontSize: 16, color: '#1A1626', letterSpacing: '-0.3px' }}>
          뽑기방 등록
        </h2>
        <div style={{ width: 36 }} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '12px 14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* 사진 업로드 */}
        <div style={sectionStyle}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#5B5470', marginBottom: 10 }}>
            사진 <span style={{ color: '#9B94AD', fontWeight: 500 }}>({previews.length}/{MAX_IMAGES})</span>
          </p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10 }} />
                {i === 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center',
                    fontSize: 9, fontWeight: 800, background: 'rgba(124,58,237,0.8)', color: '#fff',
                    borderBottomLeftRadius: 10, borderBottomRightRadius: 10, padding: '2px 0',
                  }}>대표</div>
                )}
                <button type="button" onClick={() => removeImage(i)} style={{
                  position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                  borderRadius: '50%', background: '#EF4444', color: '#fff', border: 'none',
                  cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            ))}
            {previews.length < MAX_IMAGES && (
              <label style={{
                width: 72, height: 72, borderRadius: 10, border: '1.5px dashed #C4BAD8',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#9B94AD', fontSize: 11, fontWeight: 600, gap: 4, flexShrink: 0,
              }}>
                <span style={{ fontSize: 20 }}>📷</span>
                추가
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>
        </div>

        {/* 기본 정보 */}
        <div style={{ ...sectionStyle, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#5B5470' }}>기본 정보</p>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9B94AD', display: 'block', marginBottom: 6 }}>
              상호명 <span style={{ color: '#7C3AED' }}>*</span>
            </label>
            <input
              value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="예: 뽑기천국 강남점" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#EDEAF2'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9B94AD', display: 'block', marginBottom: 6 }}>
              주소 <span style={{ color: '#7C3AED' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                value={form.address} onChange={e => set('address', e.target.value)}
                placeholder={geocoding ? '주소 불러오는 중...' : '지도에서 선택하면 자동 입력'} required
                style={{ ...inputStyle, paddingRight: geocoding ? 80 : 16 }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#EDEAF2'}
              />
              {geocoding && (
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#9B94AD' }}>
                  조회 중...
                </span>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9B94AD', display: 'block', marginBottom: 6 }}>영업시간</label>
            <input
              value={form.openTime} onChange={e => set('openTime', e.target.value)}
              placeholder="예: 10:00 ~ 22:00" style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#EDEAF2'}
            />
          </div>
        </div>

        {/* 기계 정보 */}
        <div style={sectionStyle}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#5B5470', marginBottom: 12 }}>기계 정보</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['coin500', '500원 기계'], ['coin1000', '1000원 기계'], ['parking', '주차 가능']].map(([key, label]) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', userSelect: 'none',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1626' }}>{label}</span>
                <div
                  onClick={() => set(key, !form[key])}
                  style={{
                    width: 48, height: 28, borderRadius: 999, transition: 'background 0.2s',
                    background: form[key] ? '#7C3AED' : '#E2DDEC', position: 'relative', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: form[key] ? 23 : 3,
                    width: 22, height: 22, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#5B5470', marginBottom: 10 }}>난이도</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {DIFFICULTY_OPTIONS.map(({ val, label, color }) => (
                <button
                  key={val} type="button" onClick={() => set('difficulty', val)}
                  style={{
                    flex: 1, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                    background: form.difficulty === val ? `${color}20` : '#F7F5FA',
                    color: form.difficulty === val ? color : '#9B94AD',
                    outline: form.difficulty === val ? `2px solid ${color}` : '2px solid transparent',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 등록 버튼 */}
        <button type="submit" disabled={uploading} style={{
          width: '100%', height: 54, borderRadius: 14, border: 'none',
          cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          fontSize: 15, fontWeight: 800,
          background: uploading ? '#EDEAF2' : 'linear-gradient(135deg, #9B6CFF, #7C3AED)',
          color: uploading ? '#9B94AD' : '#fff',
          boxShadow: uploading ? 'none' : '0 6px 16px rgba(124,58,237,0.32)',
          transition: 'all 0.15s',
        }}>
          {uploading ? '등록 중...' : '등록하기'}
        </button>
      </form>
    </div>
  )
}
