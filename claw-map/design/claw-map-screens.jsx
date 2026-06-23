/* global React */
const { useState } = React;

// ─────────────────────────────────────────────────────────────
// Tokens
// ─────────────────────────────────────────────────────────────
const C = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primarySoft: '#EDE7FF',
  primaryFaint: '#F6F2FF',
  text: '#1A1626',
  text2: '#5B5470',
  text3: '#9B94AD',
  line: '#EDEAF2',
  bg: '#F7F5FA',
  yellow: '#FBBF24',
  pink: '#FF6B9D',
  green: '#10B981',
};

const FONT = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

// ─────────────────────────────────────────────────────────────
// Stylized map background — original art (no branded map service)
// ─────────────────────────────────────────────────────────────
function MapCanvas({ children }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: '#EAF1F5',
    }}>
      <svg width="100%" height="100%" viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0 }}>
        {/* base color blocks — neighborhoods */}
        <rect x="0" y="0" width="390" height="700" fill="#EEF2F4"/>
        {/* park patches */}
        <path d="M0,420 Q60,400 110,430 T220,440 L220,520 Q140,540 60,520 L0,540 Z" fill="#D7E9CC" opacity="0.85"/>
        <path d="M260,80 Q310,70 360,100 L390,110 L390,180 Q330,200 280,180 L260,170 Z" fill="#D7E9CC" opacity="0.7"/>
        {/* river */}
        <path d="M-10,260 C80,240 140,300 230,280 C300,265 350,310 400,300 L400,340 C340,348 290,310 220,322 C140,338 80,290 -10,310 Z"
              fill="#BCD7E8" opacity="0.85"/>
        {/* large blocks */}
        <g fill="#E5E0EE" opacity="0.55">
          <rect x="20" y="30" width="80" height="50" rx="6"/>
          <rect x="120" y="30" width="60" height="60" rx="6"/>
          <rect x="200" y="40" width="70" height="38" rx="6"/>
          <rect x="20" y="120" width="120" height="80" rx="6"/>
          <rect x="160" y="120" width="80" height="100" rx="6"/>
          <rect x="260" y="220" width="120" height="90" rx="6"/>
          <rect x="20" y="600" width="120" height="80" rx="6"/>
          <rect x="160" y="580" width="100" height="100" rx="6"/>
          <rect x="280" y="600" width="100" height="80" rx="6"/>
        </g>
        {/* main roads */}
        <g stroke="#FFFFFF" strokeLinecap="round" fill="none">
          <path d="M0,100 L390,110" strokeWidth="14"/>
          <path d="M0,210 L390,225" strokeWidth="10"/>
          <path d="M0,360 L390,370" strokeWidth="16"/>
          <path d="M0,580 L390,575" strokeWidth="11"/>
          <path d="M150,0 L160,700" strokeWidth="12"/>
          <path d="M300,0 L312,700" strokeWidth="9"/>
          <path d="M70,0 L72,700" strokeWidth="7"/>
        </g>
        {/* road labels */}
        <g fontFamily={FONT} fontSize="9" fill="#9B94AD" fontWeight="600">
          <text x="170" y="356">테헤란로</text>
          <text x="170" y="105" transform="rotate(0 170 105)">강남대로</text>
          <text x="160" y="14" transform="rotate(90 160 14)" textAnchor="end">언주로</text>
        </g>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Map pin
// ─────────────────────────────────────────────────────────────
function Pin({ left, top, selected, label, count }) {
  const size = selected ? 1 : 0.78;
  return (
    <div style={{
      position: 'absolute', left, top, transform: `translate(-50%, -100%) scale(${size})`,
      transformOrigin: '50% 100%', zIndex: selected ? 5 : 2,
      filter: selected ? 'drop-shadow(0 8px 16px rgba(124,58,237,0.45))' : 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
      transition: 'transform .2s',
    }}>
      <svg width="44" height="56" viewBox="0 0 44 56">
        <defs>
          <linearGradient id={`pg-${left}-${top}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#9B6CFF"/>
            <stop offset="1" stopColor={C.primary}/>
          </linearGradient>
        </defs>
        <path d="M22 2C11 2 2 10.5 2 21c0 9 7 16 18 31 1.4 1.9 2.6 1.9 4 0 11-15 18-22 18-31C42 10.5 33 2 22 2Z"
              fill={`url(#pg-${left}-${top})`} stroke="#fff" strokeWidth="2.5"/>
        <circle cx="22" cy="20" r="11" fill="#fff"/>
        {count !== undefined ? (
          <text x="22" y="24.5" textAnchor="middle" fontFamily={FONT} fontSize="12" fontWeight="800" fill={C.primary}>{count}</text>
        ) : (
          // claw machine glyph
          <g transform="translate(22 20)">
            <path d="M-6 -5 L6 -5 M-4 -5 L-4 -2 M4 -5 L4 -2 M0 -5 L0 -1" stroke={C.primary} strokeWidth="1.6" strokeLinecap="round" fill="none"/>
            <circle cx="0" cy="3" r="3" fill={C.primary}/>
          </g>
        )}
      </svg>
      {selected && label && (
        <div style={{
          position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)',
          background: '#1A1626', color: '#fff', padding: '6px 12px', borderRadius: 14,
          fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: FONT,
          boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
        }}>
          {label}
          <div style={{
            position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)',
            width: 8, height: 8, background: '#1A1626',
          }}/>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Search bar
// ─────────────────────────────────────────────────────────────
function SearchBar() {
  return (
    <div style={{
      position: 'absolute', top: 56, left: 14, right: 14, zIndex: 30,
    }}>
      <div style={{
        height: 52, background: '#fff', borderRadius: 18,
        boxShadow: '0 6px 20px rgba(31,17,68,0.10), 0 1px 3px rgba(31,17,68,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 8px 0 18px', gap: 12,
      }}>
        {/* search icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke={C.primary} strokeWidth="2.2"/>
          <path d="M14 14l4 4" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        <div style={{ flex: 1, fontFamily: FONT, fontSize: 15, color: C.text3, fontWeight: 500 }}>
          어디서 뽑을까요?
        </div>
        {/* filter */}
        <div style={{
          width: 36, height: 36, background: C.primaryFaint, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M4 8h8M6 12h4" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      {/* quick filter chips */}
      <div style={{
        marginTop: 10, display: 'flex', gap: 8, overflowX: 'auto',
        paddingBottom: 2,
      }}>
        {[
          { label: '전체', active: true, icon: '✨' },
          { label: '500원', icon: '🪙' },
          { label: '24시간', icon: '🌙' },
          { label: '주차가능', icon: '🅿️' },
          { label: '대형', icon: '🐻' },
        ].map(c => (
          <div key={c.label} style={{
            height: 34, padding: '0 14px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 5,
            background: c.active ? C.primary : '#fff',
            color: c.active ? '#fff' : C.text2,
            fontSize: 13, fontWeight: 700, fontFamily: FONT,
            boxShadow: c.active
              ? '0 3px 10px rgba(124,58,237,0.32)'
              : '0 2px 6px rgba(31,17,68,0.07)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <span style={{ fontSize: 12 }}>{c.icon}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FAB cluster (right-bottom)
// ─────────────────────────────────────────────────────────────
function FabCluster({ bottomOffset = 24 }) {
  return (
    <div style={{
      position: 'absolute', right: 14, bottom: bottomOffset, zIndex: 25,
      display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
    }}>
      {/* re-search button */}
      <div style={{
        height: 40, padding: '0 16px', background: '#fff',
        borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 6px 18px rgba(31,17,68,0.14)',
        fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.primary,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7a5 5 0 0 1 9-3M12 7a5 5 0 0 1-9 3M11 1v3h-3M3 13v-3h3"
                stroke={C.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        이 지역 다시 검색
      </div>
      {/* GPS FAB */}
      <div style={{
        width: 52, height: 52, background: '#fff', borderRadius: 999,
        boxShadow: '0 8px 22px rgba(31,17,68,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${C.primarySoft}`,
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="3.2" fill={C.primary}/>
          <circle cx="11" cy="11" r="7.5" stroke={C.primary} strokeWidth="2" fill="none"/>
          <path d="M11 1.5v3M11 17.5v3M1.5 11h3M17.5 11h3" stroke={C.primary} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom tab bar
// ─────────────────────────────────────────────────────────────
function TabBar({ active = 'map' }) {
  const items = [
    { id: 'map', label: '지도', icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" stroke={a ? C.primary : C.text3} strokeWidth="2" strokeLinejoin="round" fill={a ? C.primarySoft : 'none'}/>
        <path d="M9 4v14M15 6v14" stroke={a ? C.primary : C.text3} strokeWidth="2"/>
      </svg>
    )},
    { id: 'fav', label: '찜', icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={a ? C.primary : 'none'}>
        <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"
              stroke={a ? C.primary : C.text3} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'home', label: '홈', icon: (a) => (
      <div style={{
        width: 56, height: 56, marginTop: -22, borderRadius: '50%',
        background: `linear-gradient(135deg, #9B6CFF, ${C.primary})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 24px rgba(124,58,237,0.45)',
        border: '4px solid #fff',
      }}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          {/* claw machine icon */}
          <path d="M5 4 L21 4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
          <path d="M7 4 L7 8 M19 4 L19 8 M13 4 L13 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="13" cy="14" r="5" fill="#fff"/>
          <path d="M11 14h4" stroke={C.primary} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    )},
    { id: 'event', label: '이벤트', icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 10h16v10H4z" stroke={a ? C.primary : C.text3} strokeWidth="2" fill={a ? C.primarySoft : 'none'}/>
        <path d="M3 7h18v3H3zM12 7v13M9 7s-3-3 0-3 3 3 3 3M15 7s3-3 0-3-3 3-3 3"
              stroke={a ? C.primary : C.text3} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'my', label: '마이', icon: (a) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="3.5" stroke={a ? C.primary : C.text3} strokeWidth="2" fill={a ? C.primarySoft : 'none'}/>
        <path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke={a ? C.primary : C.text3} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )},
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      background: '#fff',
      paddingBottom: 22, paddingTop: 10,
      boxShadow: '0 -4px 18px rgba(31,17,68,0.08)',
      borderTop: `1px solid ${C.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around' }}>
        {items.map(it => {
          const a = it.id === active;
          return (
            <div key={it.id} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, paddingTop: 4,
            }}>
              {it.icon(a)}
              <div style={{
                fontFamily: FONT, fontSize: 11, fontWeight: a ? 800 : 600,
                color: a ? C.primary : C.text3, letterSpacing: -0.2,
              }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom sheet handle
// ─────────────────────────────────────────────────────────────
function SheetHandle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 6 }}>
      <div style={{ width: 40, height: 5, borderRadius: 999, background: '#E2DDEC' }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Spot card (used in list)
// ─────────────────────────────────────────────────────────────
function SpotCard({ spot, idx }) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 0',
      borderBottom: idx < 3 ? `1px solid ${C.line}` : 'none',
    }}>
      {/* thumbnail */}
      <div style={{
        width: 78, height: 78, borderRadius: 16, flexShrink: 0,
        background: spot.thumbBg, position: 'relative', overflow: 'hidden',
      }}>
        {/* striped placeholder */}
        <svg width="100%" height="100%" viewBox="0 0 78 78" preserveAspectRatio="none">
          <defs>
            <pattern id={`stripe-${idx}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.5)" strokeWidth="3"/>
            </pattern>
          </defs>
          <rect width="78" height="78" fill={`url(#stripe-${idx})`}/>
        </svg>
        {/* badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: 'rgba(26,22,38,0.7)', color: '#fff',
          fontSize: 10, fontWeight: 800, padding: '3px 6px', borderRadius: 6,
          fontFamily: FONT,
        }}>{spot.distance}</div>
      </div>
      {/* info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            fontFamily: FONT, fontSize: 16, fontWeight: 800, color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{spot.name}</div>
          {spot.new && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: C.pink,
              background: '#FFE5EE', padding: '2px 6px', borderRadius: 6, fontFamily: FONT, flexShrink: 0,
            }}>NEW</div>
          )}
        </div>
        {/* rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <svg width="13" height="13" viewBox="0 0 13 13"><path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z" fill={C.yellow}/></svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.text, fontFamily: FONT }}>{spot.rating}</span>
          <span style={{ fontSize: 12, color: C.text3, fontFamily: FONT }}>· 후기 {spot.reviews}</span>
          {spot.openNow && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: C.text3, display: 'inline-block' }}/>
              <span style={{ fontSize: 12, color: C.green, fontWeight: 700, fontFamily: FONT }}>● 영업중</span>
            </>
          )}
        </div>
        {/* tags */}
        <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
          {spot.tags.map(t => (
            <div key={t} style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: C.primaryFaint, color: C.primaryDark, fontFamily: FONT,
            }}>{t}</div>
          ))}
        </div>
      </div>
      {/* heart */}
      <div style={{ paddingTop: 4 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill={spot.liked ? C.pink : 'none'}>
          <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"
                stroke={spot.liked ? C.pink : '#C8C2D6'} strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

const SAMPLE_SPOTS = [
  { name: '인생네컷 강남역점', distance: '120m', rating: 4.8, reviews: 142, tags: ['500원', '24시간', '주차'], openNow: true, thumbBg: 'linear-gradient(135deg,#9B6CFF,#7C3AED)', new: true, liked: true },
  { name: '뽑기천국 신논현', distance: '340m', rating: 4.6, reviews: 89, tags: ['1000원', '대형인형'], openNow: true, thumbBg: 'linear-gradient(135deg,#FF9DC0,#FF6B9D)' },
  { name: '클로존 역삼점', distance: '480m', rating: 4.4, reviews: 67, tags: ['500원', '주차'], openNow: true, thumbBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)' },
  { name: '미니샵 테헤란', distance: '620m', rating: 4.2, reviews: 38, tags: ['500원', '1000원'], openNow: false, thumbBg: 'linear-gradient(135deg,#34D399,#10B981)' },
];

// ─────────────────────────────────────────────────────────────
// State 1 — sheet minimized (handle only)
// ─────────────────────────────────────────────────────────────
function StateMinimized() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
      <MapCanvas/>
      {/* pins */}
      <Pin left="120px" top="200px" />
      <Pin left="80px" top="290px" count={3}/>
      <Pin left="240px" top="240px" />
      <Pin left="180px" top="380px" />
      <Pin left="290px" top="430px" />
      <Pin left="140px" top="500px" />

      <SearchBar/>
      <FabCluster bottomOffset={170}/>

      {/* minimized sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 88, zIndex: 35,
        background: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -10px 30px rgba(31,17,68,0.10)',
        paddingBottom: 16,
      }}>
        <SheetHandle/>
        <div style={{
          padding: '4px 20px 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: -0.4 }}>
              내 주변 뽑기방 <span style={{ color: C.primary }}>24곳</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.text3, marginTop: 2 }}>
              위로 올려서 목록 보기
            </div>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 12, background: C.primaryFaint,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 9l4-4 4 4" stroke={C.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </div>
        </div>
      </div>

      <TabBar active="map"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// State 2 — sheet half (list visible)
// ─────────────────────────────────────────────────────────────
function StateHalfSheet() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
      <MapCanvas/>
      <Pin left="120px" top="170px"/>
      <Pin left="80px" top="240px" count={3}/>
      <Pin left="240px" top="200px"/>
      <Pin left="290px" top="280px"/>

      <SearchBar/>

      {/* half sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 88, zIndex: 35,
        height: 440,
        background: '#fff',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: '0 -10px 30px rgba(31,17,68,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <SheetHandle/>
        {/* title row */}
        <div style={{
          padding: '6px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${C.line}`,
        }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 800, color: C.text, letterSpacing: -0.4 }}>
              근처 뽑기방 <span style={{ color: C.primary }}>24곳</span>
            </div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.text3, marginTop: 3 }}>
              강남역 기준 · 1km 이내
            </div>
          </div>
          {/* sort */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.text2,
            padding: '7px 12px', background: C.bg, borderRadius: 999,
          }}>
            거리순
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 3.5l3 3 3-3" stroke={C.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </div>
        </div>
        {/* list */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0 20px' }}>
          {SAMPLE_SPOTS.map((s, i) => <SpotCard key={i} spot={s} idx={i}/>)}
        </div>
      </div>

      <TabBar active="map"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// State 3 — pin selected, mini preview card
// ─────────────────────────────────────────────────────────────
function StatePinPreview() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff' }}>
      <MapCanvas/>
      <Pin left="80px" top="290px" count={3}/>
      <Pin left="240px" top="240px"/>
      <Pin left="180px" top="380px"/>
      <Pin left="290px" top="430px"/>
      {/* selected pin centered-ish */}
      <Pin left="195px" top="320px" selected label="인생네컷 강남역점"/>
      {/* radius pulse */}
      <div style={{
        position: 'absolute', left: 195, top: 320, width: 90, height: 90,
        borderRadius: '50%', background: 'rgba(124,58,237,0.12)',
        border: '2px solid rgba(124,58,237,0.3)',
        transform: 'translate(-50%,-50%)', zIndex: 1,
      }}/>

      <SearchBar/>
      <FabCluster bottomOffset={300}/>

      {/* preview card */}
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 102, zIndex: 35,
        background: '#fff', borderRadius: 22,
        boxShadow: '0 14px 38px rgba(31,17,68,0.18), 0 2px 6px rgba(31,17,68,0.06)',
        overflow: 'hidden',
      }}>
        {/* hero strip */}
        <div style={{
          display: 'flex', height: 110,
        }}>
          {/* big image */}
          <div style={{
            flex: 1.4, position: 'relative',
            background: 'linear-gradient(135deg,#9B6CFF,#7C3AED)',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 200 110" preserveAspectRatio="none">
              <defs>
                <pattern id="hero-stripe" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.35)" strokeWidth="3"/>
                </pattern>
              </defs>
              <rect width="200" height="110" fill="url(#hero-stripe)"/>
            </svg>
            <div style={{
              position: 'absolute', top: 10, left: 10,
              background: 'rgba(26,22,38,0.7)', color: '#fff',
              fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 8,
              fontFamily: FONT, display: 'flex', gap: 4, alignItems: 'center',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: C.green, display: 'inline-block' }}/>
              영업중 · 24시
            </div>
            <div style={{
              position: 'absolute', bottom: 10, left: 10, color: '#fff',
              fontFamily: FONT, fontSize: 11, fontWeight: 700,
            }}>
              사진 12장
            </div>
          </div>
          {/* 2 small images */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, marginLeft: 2 }}>
            <div style={{ flex: 1, background: 'linear-gradient(135deg,#FF9DC0,#FF6B9D)' }}/>
            <div style={{ flex: 1, background: 'linear-gradient(135deg,#FBBF24,#F59E0B)', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(26,22,38,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 14,
              }}>+9</div>
            </div>
          </div>
        </div>

        {/* info */}
        <div style={{ padding: '14px 18px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 800, color: C.text }}>
                  인생네컷 강남역점
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: C.pink,
                  background: '#FFE5EE', padding: '2px 5px', borderRadius: 5, fontFamily: FONT,
                }}>NEW</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                <svg width="13" height="13" viewBox="0 0 13 13"><path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z" fill={C.yellow}/></svg>
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 800, color: C.text }}>4.8</span>
                <span style={{ fontFamily: FONT, fontSize: 12, color: C.text3 }}>(후기 142)</span>
                <span style={{ width: 3, height: 3, borderRadius: 999, background: C.text3 }}/>
                <span style={{ fontFamily: FONT, fontSize: 12, color: C.text2, fontWeight: 600 }}>120m</span>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.text3, marginTop: 5 }}>
                서울 강남구 강남대로 123, 지하 1층
              </div>
            </div>
            {/* heart */}
            <div style={{
              width: 40, height: 40, borderRadius: 12, background: '#FFE5EE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={C.pink}>
                <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"/>
              </svg>
            </div>
          </div>
          {/* tags */}
          <div style={{ display: 'flex', gap: 5, marginTop: 12, flexWrap: 'wrap' }}>
            {['🪙 500원', '💴 1000원', '🅿️ 주차', '🌙 24시간', '🐻 대형인형'].map(t => (
              <div key={t} style={{
                fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 8,
                background: C.primaryFaint, color: C.primaryDark, fontFamily: FONT,
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* CTA row */}
        <div style={{
          display: 'flex', gap: 8, padding: '14px 16px 16px',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: C.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${C.line}`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 5l5-1 4 16 5-1" stroke={C.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 9l6 6M15 9l-6 6" stroke={C.text2} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{
            flex: 1, height: 48, borderRadius: 14, background: '#fff',
            border: `1.5px solid ${C.primary}`, color: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: FONT, fontSize: 14, fontWeight: 800,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L13 8M9 4l4 4-4 4" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            길찾기
          </div>
          <div style={{
            flex: 1.4, height: 48, borderRadius: 14,
            background: `linear-gradient(135deg,#9B6CFF,${C.primary})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            color: '#fff', fontFamily: FONT, fontSize: 14, fontWeight: 800,
            boxShadow: '0 6px 16px rgba(124,58,237,0.32)',
          }}>
            상세보기
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <TabBar active="map"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Frame wrapper — clean rounded device with status bar (390x844)
// ─────────────────────────────────────────────────────────────
function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: '#fff',
      boxShadow: '0 30px 80px rgba(31,17,68,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: FONT,
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 35, borderRadius: 22, background: '#000', zIndex: 100,
      }}/>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 30px', paddingTop: 16,
      }}>
        <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: C.text }}>9:41</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" fill={C.text}/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0" stroke={C.text} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1.2" fill={C.text}/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={C.text} fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill={C.text}/><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={C.text}/></svg>
        </div>
      </div>
      {/* content */}
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.35)', zIndex: 100,
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root — design canvas with 3 artboards
// ─────────────────────────────────────────────────────────────
function App() {
  return (
    <DesignCanvas
      title="클로맵 — 메인 지도 화면"
      subtitle="모바일 (390 × 844) · 보라/바이올렛 시스템 · 인형뽑기방 정보 지도"
    >
      <DCSection id="states" title="메인 화면 — 3가지 상태">
        <DCArtboard id="01-min" label="01. 기본 — 바텀시트 최소화" width={390} height={844}>
          <PhoneFrame><StateMinimized/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="02-half" label="02. 바텀시트 절반 — 근처 목록" width={390} height={844}>
          <PhoneFrame><StateHalfSheet/></PhoneFrame>
        </DCArtboard>
        <DCArtboard id="03-pin" label="03. 핀 클릭 — 미니 프리뷰" width={390} height={844}>
          <PhoneFrame><StatePinPreview/></PhoneFrame>
        </DCArtboard>
      </DCSection>
      <DCSection id="detail" title="스팟 상세 — 풀스크린 바텀시트">
        <DCArtboard id="04-detail-top" label="04. 상세 — 사진/정보/태그" width={390} height={844}>
          <DetailPhone scrollTop={0}/>
        </DCArtboard>
        <DCArtboard id="05-detail-reviews" label="05. 상세 — 후기 영역 스크롤" width={390} height={844}>
          <DetailPhone scrollTop={620}/>
        </DCArtboard>
      </DCSection>
      <DCSection id="register" title="스팟 등록 — 풀스크린 폼">
        <DCArtboard id="06-form-empty" label="06. 등록 폼 — 빈 상태" width={390} height={844}>
          <FormPhone filled={false}/>
        </DCArtboard>
        <DCArtboard id="07-form-filled" label="07. 등록 폼 — 입력 완료 (기계 정보 영역)" width={390} height={844}>
          <FormPhone filled={true}/>
        </DCArtboard>
      </DCSection>
      <DCSection id="events" title="이벤트 탭 — 목록 · 상세">
        <DCArtboard id="10-events-list" label="10. 이벤트 — 목록" width={390} height={844}>
          <EventListPhone/>
        </DCArtboard>
        <DCArtboard id="11-events-detail" label="11. 이벤트 — 상세 + 댓글" width={390} height={844}>
          <EventDetailPhone/>
        </DCArtboard>
      </DCSection>
      <DCSection id="mypage" title="마이페이지 — 프로필 · 활동 내역">
        <DCArtboard id="08-mypage-top" label="08. 마이페이지 — 프로필 · 등록 뽑기방" width={390} height={844}>
          <MyPagePhone scrollTop={0}/>
        </DCArtboard>
        <DCArtboard id="09-mypage-reviews" label="09. 마이페이지 — 찜 · 내 후기" width={390} height={844}>
          <MyPagePhone scrollTop={620}/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
