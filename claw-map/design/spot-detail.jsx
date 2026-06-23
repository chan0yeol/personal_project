/* global React */
// Spot detail screen — 클로맵
// Renders the full screen as one tall scrolling document. Two artboards
// expose different scroll positions in the design canvas.

const SD_C = {
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
  pinkSoft: '#FFE5EE',
  green: '#10B981',
  greenSoft: '#DCFCE7',
  red: '#EF4444',
  redSoft: '#FEE2E2',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',
};
const SD_FONT = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

// ─────────────────────────────────────────────────────────────
// Photo slider — 16:9 with dots + counter
// ─────────────────────────────────────────────────────────────
function PhotoSlider({ activeIndex = 0, count = 5 }) {
  const photos = [
    { bg: 'linear-gradient(135deg,#9B6CFF,#7C3AED)' },
    { bg: 'linear-gradient(135deg,#FF9DC0,#FF6B9D)' },
    { bg: 'linear-gradient(135deg,#FBBF24,#F59E0B)' },
    { bg: 'linear-gradient(135deg,#34D399,#10B981)' },
    { bg: 'linear-gradient(135deg,#60A5FA,#2563EB)' },
  ];
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16/9',
      background: photos[activeIndex].bg, overflow: 'hidden',
    }}>
      {/* striped placeholder pattern */}
      <svg width="100%" height="100%" viewBox="0 0 390 220" preserveAspectRatio="none"
           style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="ps-stripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.28)" strokeWidth="4"/>
          </pattern>
        </defs>
        <rect width="390" height="220" fill="url(#ps-stripe)"/>
      </svg>
      {/* placeholder caption */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 8, color: 'rgba(255,255,255,0.85)',
        fontFamily: SD_FONT, fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="3" y="6" width="26" height="20" rx="3" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
          <circle cx="16" cy="16" r="5" stroke="rgba(255,255,255,0.7)" strokeWidth="2"/>
          <circle cx="24" cy="11" r="1.4" fill="rgba(255,255,255,0.7)"/>
        </svg>
        <div>매장 사진 {activeIndex + 1}</div>
      </div>
      {/* counter pill */}
      <div style={{
        position: 'absolute', top: 16, right: 16, zIndex: 5,
        background: 'rgba(26,22,38,0.55)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: '#fff', fontFamily: SD_FONT, fontSize: 12, fontWeight: 700,
        padding: '5px 10px', borderRadius: 999,
      }}>
        {activeIndex + 1} / {count}
      </div>
      {/* dots */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 14, zIndex: 5,
        display: 'flex', justifyContent: 'center', gap: 5,
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            width: i === activeIndex ? 18 : 6, height: 6, borderRadius: 999,
            background: i === activeIndex ? '#fff' : 'rgba(255,255,255,0.5)',
            transition: 'width .25s',
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tag chip
// ─────────────────────────────────────────────────────────────
function TagChip({ icon, children, bg = SD_C.primaryFaint, fg = SD_C.primaryDark, border }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 30, padding: '0 12px', borderRadius: 10,
      background: bg, color: fg,
      fontFamily: SD_FONT, fontSize: 12.5, fontWeight: 700,
      border: border ? `1px solid ${border}` : 'none',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Difficulty pill (color coded)
// ─────────────────────────────────────────────────────────────
function DifficultyPill({ level }) {
  const map = {
    easy:   { fg: SD_C.green,  bg: SD_C.greenSoft, label: '쉬움',   emoji: '😊' },
    normal: { fg: SD_C.amber,  bg: SD_C.amberSoft, label: '보통',   emoji: '😐' },
    hard:   { fg: SD_C.red,    bg: SD_C.redSoft,   label: '어려움', emoji: '😤' },
  };
  const m = map[level];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 30, padding: '0 12px', borderRadius: 10,
      background: m.bg, color: m.fg,
      fontFamily: SD_FONT, fontSize: 12.5, fontWeight: 800,
    }}>
      <span style={{ fontSize: 12 }}>{m.emoji}</span>
      난이도 {m.label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar — placeholder google-style profile (initial in colored disk)
// ─────────────────────────────────────────────────────────────
function Avatar({ name, hue = 280 }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: `linear-gradient(135deg, oklch(0.78 0.14 ${hue}), oklch(0.62 0.18 ${hue}))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontFamily: SD_FONT, fontWeight: 800, fontSize: 14,
      flexShrink: 0,
      boxShadow: 'inset 0 0 0 2px #fff, 0 1px 3px rgba(0,0,0,0.08)',
    }}>
      {name.charAt(0)}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Review card
// ─────────────────────────────────────────────────────────────
function ReviewCard({ r, last }) {
  return (
    <div style={{
      padding: '16px 0',
      borderBottom: last ? 'none' : `1px solid ${SD_C.line}`,
    }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={r.name} hue={r.hue}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: SD_FONT, fontSize: 14, fontWeight: 800, color: SD_C.text }}>
              {r.name}
            </span>
            {r.badge && (
              <span style={{
                fontSize: 10, fontWeight: 800, color: SD_C.primary,
                background: SD_C.primarySoft, padding: '2px 6px', borderRadius: 5,
                fontFamily: SD_FONT,
              }}>{r.badge}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {/* stars */}
            <div style={{ display: 'flex', gap: 1 }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="11" height="11" viewBox="0 0 13 13">
                  <path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z"
                        fill={s <= r.rating ? SD_C.yellow : '#E5E0EE'}/>
                </svg>
              ))}
            </div>
            <span style={{ fontFamily: SD_FONT, fontSize: 11, color: SD_C.text3 }}>· {r.date}</span>
          </div>
        </div>
        {/* more */}
        <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="4" height="16" viewBox="0 0 4 16">
            <circle cx="2" cy="3" r="1.6" fill={SD_C.text3}/>
            <circle cx="2" cy="8" r="1.6" fill={SD_C.text3}/>
            <circle cx="2" cy="13" r="1.6" fill={SD_C.text3}/>
          </svg>
        </div>
      </div>
      {/* difficulty + coin used */}
      {r.tags && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {r.tags.map(t => (
            <span key={t.label} style={{
              fontSize: 10.5, fontWeight: 700, padding: '3px 7px', borderRadius: 6,
              background: t.bg, color: t.fg, fontFamily: SD_FONT,
            }}>{t.label}</span>
          ))}
        </div>
      )}
      {/* content */}
      <p style={{
        margin: '10px 0 0', fontFamily: SD_FONT, fontSize: 13.5,
        color: SD_C.text, lineHeight: 1.55, letterSpacing: -0.2,
        textWrap: 'pretty',
      }}>{r.content}</p>
      {/* photos */}
      {r.photos && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {r.photos.map((p, i) => (
            <div key={i} style={{
              width: 76, height: 76, borderRadius: 12, background: p,
              position: 'relative', overflow: 'hidden',
            }}>
              <svg width="100%" height="100%" viewBox="0 0 76 76" preserveAspectRatio="none">
                <defs>
                  <pattern id={`rev-st-${r.id}-${i}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
                  </pattern>
                </defs>
                <rect width="76" height="76" fill={`url(#rev-st-${r.id}-${i})`}/>
              </svg>
            </div>
          ))}
        </div>
      )}
      {/* like + reply */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          height: 30, padding: '0 11px', borderRadius: 999,
          background: r.liked ? SD_C.primarySoft : '#fff',
          border: `1px solid ${r.liked ? SD_C.primarySoft : SD_C.line}`,
          color: r.liked ? SD_C.primary : SD_C.text2,
          fontFamily: SD_FONT, fontSize: 12, fontWeight: 700,
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill={r.liked ? SD_C.primary : 'none'}>
            <path d="M3 6.5l2 2v-5l1.6-2.2c.3-.4 1-.3 1.1.3l.3 2.2H10c.7 0 1.2.6 1 1.3l-1 4.4c-.1.6-.7 1-1.3 1H4c-.6 0-1-.4-1-1V6.5Z"
                  stroke={r.liked ? SD_C.primary : SD_C.text2} strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          공감 {r.likes}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          height: 30, padding: '0 11px', borderRadius: 999,
          background: '#fff', border: `1px solid ${SD_C.line}`,
          color: SD_C.text2, fontFamily: SD_FONT, fontSize: 12, fontWeight: 700,
        }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6l-2 2V9H4a2 2 0 0 1-2-2V4Z"
                  stroke={SD_C.text2} strokeWidth="1.3" strokeLinejoin="round"/>
          </svg>
          답글
        </div>
      </div>
    </div>
  );
}

const SAMPLE_REVIEWS = [
  {
    id: 1, name: '뽑기왕민지', hue: 320, badge: 'TOP 리뷰어', rating: 5, date: '3일 전', liked: true, likes: 24,
    tags: [
      { label: '🪙 500원 사용', bg: SD_C.primaryFaint, fg: SD_C.primaryDark },
      { label: '😊 쉬움', bg: SD_C.greenSoft, fg: SD_C.green },
      { label: '🏆 성공', bg: SD_C.amberSoft, fg: SD_C.amber },
    ],
    content: '주말 저녁에 들렸는데 사람도 적당하고 기계 상태도 너무 좋았어요! 500원 기계가 많아서 부담 없이 즐길 수 있고, 직원분도 친절하셔서 다음에 또 올거에요 🥰',
    photos: ['linear-gradient(135deg,#9B6CFF,#7C3AED)', 'linear-gradient(135deg,#FF9DC0,#FF6B9D)'],
  },
  {
    id: 2, name: '인형러버', hue: 200, rating: 4, date: '1주 전', liked: false, likes: 8,
    tags: [
      { label: '💴 1000원 사용', bg: SD_C.primaryFaint, fg: SD_C.primaryDark },
      { label: '😐 보통', bg: SD_C.amberSoft, fg: SD_C.amber },
    ],
    content: '대형 인형 종류가 진짜 많고 신상도 빨리 들어오는 편! 다만 주말엔 사람이 너무 많아서 줄서야 해요. 평일 추천드려요.',
    photos: ['linear-gradient(135deg,#FBBF24,#F59E0B)'],
  },
  {
    id: 3, name: '코인지옥', hue: 50, rating: 4, date: '2주 전', liked: false, likes: 12,
    tags: [
      { label: '🅿️ 주차 이용', bg: SD_C.primaryFaint, fg: SD_C.primaryDark },
      { label: '😤 어려움', bg: SD_C.redSoft, fg: SD_C.red },
    ],
    content: '난이도가 좀 있는 편이라 도전 정신 가득한 분들에게 추천! 주차장이 넓어서 차 가져가도 편해요.',
  },
];

// ─────────────────────────────────────────────────────────────
// The whole detail screen as a single tall doc.
// scrollTop controls the visible window.
// ─────────────────────────────────────────────────────────────
function SpotDetailDoc() {
  return (
    <div style={{ width: '100%', background: '#fff', fontFamily: SD_FONT }}>
      {/* drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', background: '#fff' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#E2DDEC' }}/>
      </div>

      {/* photo slider */}
      <PhotoSlider activeIndex={0} count={5}/>

      {/* basic info */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                margin: 0, fontFamily: SD_FONT, fontSize: 22, fontWeight: 800,
                color: SD_C.text, letterSpacing: -0.6,
              }}>
                인생네컷 강남역점
              </h1>
              <span style={{
                fontSize: 10.5, fontWeight: 800, color: SD_C.pink,
                background: SD_C.pinkSoft, padding: '3px 7px', borderRadius: 6,
              }}>NEW</span>
            </div>
            {/* rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <svg width="15" height="15" viewBox="0 0 13 13"><path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z" fill={SD_C.yellow}/></svg>
              <span style={{ fontSize: 14.5, fontWeight: 800, color: SD_C.text }}>4.8</span>
              <span style={{ fontSize: 13, color: SD_C.text3, fontWeight: 600 }}>(후기 142)</span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: SD_C.text3 }}/>
              <span style={{ fontSize: 13, color: SD_C.green, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: SD_C.green, display: 'inline-block' }}/>
                영업중
              </span>
            </div>
            {/* address */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
              fontSize: 13, color: SD_C.text2, fontWeight: 500,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5c-2.5 0-4.5 2-4.5 4.5 0 3 4.5 7 4.5 7s4.5-4 4.5-7c0-2.5-2-4.5-4.5-4.5Z"
                      stroke={SD_C.text3} strokeWidth="1.3" strokeLinejoin="round"/>
                <circle cx="7" cy="6" r="1.5" stroke={SD_C.text3} strokeWidth="1.3"/>
              </svg>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                서울 강남구 강남대로 123, 지하 1층
              </span>
              <button style={{
                border: 'none', background: SD_C.bg, height: 28, padding: '0 10px',
                borderRadius: 8, color: SD_C.text2, fontSize: 11.5, fontWeight: 700,
                fontFamily: SD_FONT, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={SD_C.text2} strokeWidth="1.3"/>
                  <path d="M2 8.5V3a1.5 1.5 0 0 1 1.5-1.5H8" stroke={SD_C.text2} strokeWidth="1.3"/>
                </svg>
                복사
              </button>
            </div>
            {/* distance */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
              padding: '5px 10px', borderRadius: 999,
              background: SD_C.primaryFaint, color: SD_C.primaryDark,
              fontSize: 12, fontWeight: 800,
            }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="1.6" fill={SD_C.primary}/>
                <circle cx="5.5" cy="5.5" r="3.8" stroke={SD_C.primary} strokeWidth="1.2"/>
              </svg>
              현재위치에서 320m · 도보 5분
            </div>
          </div>

          {/* heart + share column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button style={{
              width: 48, height: 48, borderRadius: 14, background: SD_C.pinkSoft,
              border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 1,
              cursor: 'pointer',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={SD_C.pink}>
                <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"/>
              </svg>
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, color: SD_C.pink, fontFamily: SD_FONT }}>342</span>
          </div>
        </div>
      </div>

      {/* tags section */}
      <div style={{ padding: '18px 20px 4px' }}>
        <div style={{
          fontFamily: SD_FONT, fontSize: 12, fontWeight: 800, color: SD_C.text3,
          letterSpacing: 0.4, marginBottom: 10, textTransform: 'uppercase',
        }}>매장 정보</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <TagChip icon="🪙">500원 기계</TagChip>
          <TagChip icon="💴">1000원 기계</TagChip>
          <TagChip icon="🅿️">주차 가능</TagChip>
          <DifficultyPill level="normal"/>
          <TagChip icon="🐻">대형 인형</TagChip>
          <TagChip icon="🎴">신상 입고</TagChip>
        </div>

        {/* hours card */}
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 16,
          background: SD_C.bg, border: `1px solid ${SD_C.line}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7" stroke={SD_C.primary} strokeWidth="1.6"/>
                <path d="M9 4.5V9l3 2" stroke={SD_C.primary} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 800, color: SD_C.text }}>영업시간</span>
              <span style={{
                fontSize: 11, fontWeight: 800, color: SD_C.green,
                background: SD_C.greenSoft, padding: '2px 7px', borderRadius: 6,
              }}>영업중</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 5l4 4 4-4" stroke={SD_C.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </div>
          <div style={{
            marginTop: 10, fontSize: 13, color: SD_C.text2, fontWeight: 600,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>오늘 (수)</span>
            <span style={{ color: SD_C.text, fontWeight: 700 }}>24시간 운영</span>
          </div>
        </div>
      </div>

      {/* divider */}
      <div style={{ height: 8, background: SD_C.bg, margin: '20px 0 0' }}/>

      {/* reviews section */}
      <div style={{ padding: '20px 20px 16px' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{
              margin: 0, fontFamily: SD_FONT, fontSize: 18, fontWeight: 800,
              color: SD_C.text, letterSpacing: -0.4,
            }}>
              후기 <span style={{ color: SD_C.primary }}>142</span>
            </h2>
          </div>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            height: 34, padding: '0 12px', borderRadius: 999,
            background: SD_C.primarySoft, border: 'none',
            color: SD_C.primary, fontFamily: SD_FONT, fontSize: 12.5, fontWeight: 800,
            cursor: 'pointer',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke={SD_C.primary} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            후기 쓰기
          </button>
        </div>

        {/* rating summary */}
        <div style={{
          marginTop: 14, padding: '14px 16px', borderRadius: 16,
          background: SD_C.primaryFaint,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: SD_FONT, fontSize: 30, fontWeight: 800, color: SD_C.primary, lineHeight: 1, letterSpacing: -1 }}>4.8</div>
            <div style={{ display: 'flex', gap: 1, marginTop: 5 }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="11" height="11" viewBox="0 0 13 13"><path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z" fill={SD_C.yellow}/></svg>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 5, pct: 78 },
              { label: 4, pct: 16 },
              { label: 3, pct: 4 },
              { label: 2, pct: 1 },
              { label: 1, pct: 1 },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: SD_C.text3, width: 8 }}>{r.label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 999, background: 'rgba(124,58,237,0.15)', overflow: 'hidden' }}>
                  <div style={{ width: `${r.pct}%`, height: '100%', background: SD_C.primary, borderRadius: 999 }}/>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: SD_C.text3, width: 26, textAlign: 'right' }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* filter chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { label: '전체 142', active: true },
            { label: '📷 사진 89', active: false },
            { label: '🏆 성공 64', active: false },
            { label: '😊 쉬움 32', active: false },
          ].map(c => (
            <div key={c.label} style={{
              height: 30, padding: '0 12px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center',
              background: c.active ? SD_C.text : '#fff',
              color: c.active ? '#fff' : SD_C.text2,
              border: c.active ? 'none' : `1px solid ${SD_C.line}`,
              fontFamily: SD_FONT, fontSize: 12, fontWeight: 700,
            }}>{c.label}</div>
          ))}
        </div>

        {/* reviews */}
        <div style={{ marginTop: 8 }}>
          {SAMPLE_REVIEWS.map((r, i) => (
            <ReviewCard key={r.id} r={r} last={i === SAMPLE_REVIEWS.length - 1}/>
          ))}
        </div>

        {/* more button */}
        <button style={{
          width: '100%', marginTop: 16, height: 48, borderRadius: 14,
          background: '#fff', border: `1px solid ${SD_C.line}`,
          fontFamily: SD_FONT, fontSize: 14, fontWeight: 800, color: SD_C.text2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          cursor: 'pointer',
        }}>
          후기 142개 모두 보기
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 3l4 3.5-4 3.5" stroke={SD_C.text2} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* spacer for sticky CTA */}
      <div style={{ height: 90 }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top app bar (close + share)
// ─────────────────────────────────────────────────────────────
function DetailTopBar() {
  const Btn = ({ children }) => (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(31,17,68,0.12)',
    }}>{children}</div>
  );
  return (
    <div style={{
      position: 'absolute', top: 60, left: 14, right: 14, zIndex: 50,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <Btn>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke={SD_C.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Btn>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="3.5" cy="8" r="2" stroke={SD_C.text} strokeWidth="1.6"/>
            <circle cx="12.5" cy="3.5" r="2" stroke={SD_C.text} strokeWidth="1.6"/>
            <circle cx="12.5" cy="12.5" r="2" stroke={SD_C.text} strokeWidth="1.6"/>
            <path d="M5.5 7l5-2.5M5.5 9l5 2.5" stroke={SD_C.text} strokeWidth="1.6"/>
          </svg>
        </Btn>
        <Btn>
          <svg width="4" height="16" viewBox="0 0 4 16">
            <circle cx="2" cy="3" r="1.7" fill={SD_C.text}/>
            <circle cx="2" cy="8" r="1.7" fill={SD_C.text}/>
            <circle cx="2" cy="13" r="1.7" fill={SD_C.text}/>
          </svg>
        </Btn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sticky bottom CTA (write review)
// ─────────────────────────────────────────────────────────────
function DetailBottomCTA() {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 60,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderTop: `1px solid ${SD_C.line}`,
      padding: '12px 16px 30px',
      display: 'flex', gap: 10,
    }}>
      <button style={{
        width: 56, height: 56, borderRadius: 16,
        background: '#fff', border: `1px solid ${SD_C.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 11l18-7-7 18-3-7-8-4Z" stroke={SD_C.text2} strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </button>
      <button style={{
        flex: 1, height: 56, borderRadius: 16,
        background: `linear-gradient(135deg,#9B6CFF,${SD_C.primary})`,
        color: '#fff', border: 'none',
        fontFamily: SD_FONT, fontSize: 15, fontWeight: 800, letterSpacing: -0.2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        boxShadow: '0 8px 22px rgba(124,58,237,0.36)',
        cursor: 'pointer',
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 13l1-3 8-8 3 3-8 8-3 1-1-1Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
        후기 작성하기
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Phone frame for the detail screen — viewport that scrolls the doc
// ─────────────────────────────────────────────────────────────
function DetailPhone({ scrollTop = 0 }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: '#fff',
      boxShadow: '0 30px 80px rgba(31,17,68,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: SD_FONT,
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 35, borderRadius: 22, background: '#000', zIndex: 100,
      }}/>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 90,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 30px 0',
        background: scrollTop > 0 ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrollTop > 0 ? 'blur(8px)' : 'none',
      }}>
        <div style={{ fontFamily: SD_FONT, fontSize: 15, fontWeight: 800, color: SD_C.text }}>9:41</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" fill={SD_C.text}/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0" stroke={SD_C.text} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1.2" fill={SD_C.text}/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={SD_C.text} fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill={SD_C.text}/><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={SD_C.text}/></svg>
        </div>
      </div>

      {/* scroll viewport */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: '#fff',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: -scrollTop,
        }}>
          <SpotDetailDoc/>
        </div>
      </div>

      <DetailTopBar/>
      <DetailBottomCTA/>

      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.35)', zIndex: 100,
      }}/>
    </div>
  );
}

window.DetailPhone = DetailPhone;
