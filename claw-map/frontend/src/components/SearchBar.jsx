import { useState, useRef } from 'react'

const FILTER_CHIPS = [
  { label: '전체', id: 'all', icon: '✨' },
  { label: '500원', id: 'coin500', icon: '🪙' },
  { label: '24시간', id: 'open24', icon: '🌙' },
  { label: '주차가능', id: 'parking', icon: '🅿️' },
  { label: '별점 4+', id: 'rating4', icon: '⭐' },
]

export default function SearchBar({ onSelect, activeFilter, onFilterChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  const search = (keyword) => {
    if (!keyword.trim()) { setResults([]); return }
    const ps = new window.kakao.maps.services.Places()
    ps.keywordSearch(keyword, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setResults(result.slice(0, 6))
      } else {
        setResults([])
      }
    })
  }

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  const handleSelect = (place) => {
    onSelect({ lat: parseFloat(place.y), lng: parseFloat(place.x) })
    setQuery(place.place_name)
    setResults([])
    setOpen(false)
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 검색 인풋 */}
      <div style={{
        height: 52, background: '#fff', borderRadius: 18,
        boxShadow: '0 6px 20px rgba(31,17,68,0.10), 0 1px 3px rgba(31,17,68,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 8px 0 18px', gap: 12,
        position: 'relative',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="9" cy="9" r="6.5" stroke="#7C3AED" strokeWidth="2.2" />
          <path d="M14 14l4 4" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="어디서 뽑을까요?"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 15, fontWeight: 500, color: '#1A1626',
            fontFamily: 'inherit',
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#F7F5FA', color: '#9B94AD', fontSize: 13, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        )}
        {!query && (
          <div style={{
            width: 36, height: 36, background: '#F6F2FF', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* 필터 칩 */}
      <div style={{ marginTop: 10, display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTER_CHIPS.map(chip => {
          const active = (activeFilter ?? 'all') === chip.id
          return (
            <button
              key={chip.id}
              onClick={() => onFilterChange?.(chip.id)}
              style={{
                height: 34, padding: '0 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                background: active ? '#7C3AED' : '#fff',
                color: active ? '#fff' : '#5B5470',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: active
                  ? '0 3px 10px rgba(124,58,237,0.32)'
                  : '0 2px 6px rgba(31,17,68,0.07)',
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 12 }}>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          )
        })}
      </div>

      {/* 검색 결과 드롭다운 */}
      {open && results.length > 0 && (
        <div style={{
          marginTop: 8, background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 28px rgba(31,17,68,0.14)', overflow: 'hidden',
          border: '1px solid #EDEAF2',
        }}>
          {results.map((place, i) => (
            <button
              key={i}
              onClick={() => handleSelect(place)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 16px',
                border: 'none', borderBottom: i < results.length - 1 ? '1px solid #EDEAF2' : 'none',
                cursor: 'pointer', background: 'transparent', fontFamily: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F6F2FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1626' }}>{place.place_name}</p>
              <p style={{ fontSize: 12, color: '#9B94AD', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {place.road_address_name || place.address_name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
