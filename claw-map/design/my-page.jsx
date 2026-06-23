/* global React */
// My Page — 클로맵
// Full-screen page with profile, activity stats, my spots / liked / reviews. 390x844.

const MP_C = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primarySoft: '#EDE7FF',
  primaryFaint: '#F6F2FF',
  text: '#1A1626',
  text2: '#5B5470',
  text3: '#9B94AD',
  text4: '#C8C2D6',
  line: '#EDEAF2',
  bg: '#F5F4F8',
  yellow: '#FBBF24',
  pink: '#FF6B9D',
  pinkSoft: '#FFE5EE',
  green: '#10B981',
  greenSoft: '#DCFCE7',
};
const MP_FONT = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

// ─────────────────────────────────────────────────────────────
// Profile card with purple gradient
// ─────────────────────────────────────────────────────────────
function ProfileCard() {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 22, overflow: 'hidden',
      background: `linear-gradient(135deg, #9B6CFF 0%, ${MP_C.primary} 60%, ${MP_C.primaryDark} 100%)`,
      padding: '20px 18px',
      boxShadow: '0 14px 30px rgba(124,58,237,0.28)',
    }}>
      {/* decorative blobs */}
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ position: 'absolute', top: -40, right: -40, opacity: 0.18 }}>
        <circle cx="80" cy="80" r="80" fill="#fff"/>
      </svg>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ position: 'absolute', bottom: -30, left: 60, opacity: 0.12 }}>
        <circle cx="50" cy="50" r="50" fill="#fff"/>
      </svg>
      {/* sparkles */}
      <div style={{ position: 'absolute', top: 24, right: 90, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>✨</div>
      <div style={{ position: 'absolute', top: 48, right: 38, color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>✦</div>

      {/* logout button */}
      <button style={{
        position: 'absolute', top: 18, right: 18,
        height: 30, padding: '0 11px', borderRadius: 999,
        background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff', fontFamily: MP_FONT, fontSize: 11.5, fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5 1H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3M7 3.5L9 5.5 7 7.5M9 5.5H4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        로그아웃
      </button>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* avatar (Google profile placeholder) */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, oklch(0.84 0.13 320), oklch(0.62 0.18 280))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontFamily: MP_FONT, fontWeight: 800, fontSize: 26,
            border: '3px solid #fff',
            boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
          }}>민</div>
          {/* google badge */}
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 22, height: 22, borderRadius: '50%', background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13">
              <path d="M12.6 6.65c0-.41-.04-.82-.11-1.21H6.6v2.3h3.36a2.87 2.87 0 0 1-1.25 1.88v1.56h2.02c1.18-1.09 1.87-2.7 1.87-4.53Z" fill="#4285F4"/>
              <path d="M6.6 12.92c1.69 0 3.1-.56 4.13-1.52L8.71 9.84c-.56.38-1.28.6-2.11.6-1.62 0-3-1.1-3.49-2.57H1.04v1.6a6.23 6.23 0 0 0 5.56 3.45Z" fill="#34A853"/>
              <path d="M3.11 7.87a3.74 3.74 0 0 1 0-2.39V3.88H1.04a6.23 6.23 0 0 0 0 5.6l2.07-1.6Z" fill="#FBBC05"/>
              <path d="M6.6 2.91c.92 0 1.74.32 2.39.94L10.78 2.1A6.23 6.23 0 0 0 1.04 3.88l2.07 1.6c.49-1.47 1.87-2.57 3.49-2.57Z" fill="#EA4335"/>
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0, marginTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontFamily: MP_FONT, fontSize: 19, fontWeight: 800, color: '#fff',
              letterSpacing: -0.4,
            }}>뽑기왕민지</span>
            <button style={{
              width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.22)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 10L4 9.5l5.5-5.5-1.5-1.5L2.5 8 2 10Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div style={{
            marginTop: 4, fontFamily: MP_FONT, fontSize: 12, fontWeight: 500,
            color: 'rgba(255,255,255,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>minji.choi@gmail.com</div>
          {/* level badge */}
          <div style={{
            marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 24, padding: '0 9px', borderRadius: 999,
            background: 'rgba(255,255,255,0.95)',
            color: MP_C.primaryDark, fontFamily: MP_FONT, fontSize: 11, fontWeight: 800,
          }}>
            <svg width="11" height="11" viewBox="0 0 12 12">
              <path d="M6 1l1.6 3.2 3.4.5-2.5 2.4.6 3.4L6 8.9l-3.1 1.6.6-3.4L1 4.7l3.4-.5L6 1Z" fill={MP_C.yellow}/>
            </svg>
            LEVEL 7 · TOP 리뷰어
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Activity stats (3 columns)
// ─────────────────────────────────────────────────────────────
function ActivityStats() {
  const items = [
    { label: '내가 등록', value: 5, accent: MP_C.primary, icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5c0-3-2.5-5.5-5.5-5.5Z" stroke={MP_C.primary} strokeWidth="1.6" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="2" fill={MP_C.primary}/>
      </svg>
    )},
    { label: '찜한 뽑기방', value: 23, accent: MP_C.pink, icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill={MP_C.pink}>
        <path d="M9 16s-6-3.5-6-8a3.5 3.5 0 0 1 6-2.4A3.5 3.5 0 0 1 15 8c0 4.5-6 8-6 8Z"/>
      </svg>
    )},
    { label: '내 후기', value: 38, accent: MP_C.yellow, icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5l2.3 4.7 5.2.7-3.8 3.7.9 5.1L9 13.3l-4.6 2.4.9-5.1L1.5 6.9l5.2-.7L9 1.5Z" fill={MP_C.yellow}/>
      </svg>
    )},
  ];
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '4px',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
    }}>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: '14px 8px',
          borderRight: i < 2 ? `1px solid ${MP_C.line}` : 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: MP_C.bg, marginBottom: 2,
          }}>
            {it.icon}
          </div>
          <div style={{
            fontFamily: MP_FONT, fontSize: 22, fontWeight: 800,
            color: MP_C.text, lineHeight: 1, letterSpacing: -0.6,
          }}>{it.value}</div>
          <div style={{
            fontFamily: MP_FONT, fontSize: 11.5, fontWeight: 600, color: MP_C.text3,
            letterSpacing: -0.1,
          }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section block (header + list)
// ─────────────────────────────────────────────────────────────
function SectionBlock({ icon, title, count, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 18px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <h3 style={{
            margin: 0, fontFamily: MP_FONT, fontSize: 15.5, fontWeight: 800,
            color: MP_C.text, letterSpacing: -0.3,
          }}>{title}</h3>
          {count !== undefined && (
            <span style={{
              fontFamily: MP_FONT, fontSize: 12, fontWeight: 800, color: MP_C.primary,
              background: MP_C.primaryFaint, padding: '2px 8px', borderRadius: 999,
            }}>{count}</span>
          )}
        </div>
        <button style={{
          background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 2,
          fontFamily: MP_FONT, fontSize: 12, fontWeight: 700, color: MP_C.text3,
          padding: '4px 0',
        }}>
          전체보기
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M4 3l3 2.5-3 2.5" stroke={MP_C.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}

function ListRow({ children, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px',
      borderTop: `1px solid ${MP_C.line}`,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// My registered spot row
// ─────────────────────────────────────────────────────────────
function MyRegisteredRow({ spot, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px',
      borderTop: `1px solid ${MP_C.line}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, flexShrink: 0,
        background: spot.thumbBg, position: 'relative', overflow: 'hidden',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 56 56" preserveAspectRatio="none">
          <defs>
            <pattern id={`mr-st-${spot.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
            </pattern>
          </defs>
          <rect width="56" height="56" fill={`url(#mr-st-${spot.id})`}/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            fontFamily: MP_FONT, fontSize: 14.5, fontWeight: 800, color: MP_C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: -0.2,
          }}>{spot.name}</div>
          <span style={{
            fontSize: 9.5, fontWeight: 800, color: spot.statusFg,
            background: spot.statusBg, padding: '2px 6px', borderRadius: 5,
            fontFamily: MP_FONT, flexShrink: 0,
          }}>{spot.status}</span>
        </div>
        <div style={{
          marginTop: 3, fontFamily: MP_FONT, fontSize: 11.5, color: MP_C.text3, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{spot.address}</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {spot.tags.map(t => (
            <span key={t} style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: MP_C.primaryFaint, color: MP_C.primaryDark, fontFamily: MP_FONT,
            }}>{t}</span>
          ))}
          <span style={{
            fontSize: 10, color: MP_C.text3, fontFamily: MP_FONT, fontWeight: 600,
            marginLeft: 2, alignSelf: 'center',
          }}>· {spot.date} 등록</span>
        </div>
      </div>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5 3l4 4-4 4" stroke={MP_C.text4} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Liked spot row
// ─────────────────────────────────────────────────────────────
function LikedRow({ spot }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 18px',
      borderTop: `1px solid ${MP_C.line}`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, flexShrink: 0,
        background: spot.thumbBg, position: 'relative', overflow: 'hidden',
      }}>
        <svg width="100%" height="100%" viewBox="0 0 56 56" preserveAspectRatio="none">
          <defs>
            <pattern id={`lk-st-${spot.id}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.4)" strokeWidth="3"/>
            </pattern>
          </defs>
          <rect width="56" height="56" fill={`url(#lk-st-${spot.id})`}/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: MP_FONT, fontSize: 14.5, fontWeight: 800, color: MP_C.text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: -0.2,
        }}>{spot.name}</div>
        <div style={{
          marginTop: 3, fontFamily: MP_FONT, fontSize: 11.5, color: MP_C.text3, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{spot.address}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5,
            background: MP_C.primaryFaint, color: MP_C.primaryDark, fontFamily: MP_FONT,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <circle cx="4.5" cy="4.5" r="1.3" fill={MP_C.primary}/>
              <circle cx="4.5" cy="4.5" r="3.2" stroke={MP_C.primary} strokeWidth="1"/>
            </svg>
            {spot.distance}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: MP_C.text3, fontFamily: MP_FONT, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 13 13"><path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z" fill={MP_C.yellow}/></svg>
            {spot.rating} ({spot.reviews})
          </span>
        </div>
      </div>
      <button style={{
        width: 36, height: 36, borderRadius: 12,
        background: MP_C.pinkSoft, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill={MP_C.pink}>
          <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"/>
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// My review row
// ─────────────────────────────────────────────────────────────
function MyReviewRow({ r }) {
  return (
    <div style={{
      padding: '14px 18px',
      borderTop: `1px solid ${MP_C.line}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{
            fontFamily: MP_FONT, fontSize: 13.5, fontWeight: 800, color: MP_C.text, letterSpacing: -0.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{r.spot}</span>
          <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="10" height="10" viewBox="0 0 13 13">
                <path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z"
                      fill={s <= r.rating ? MP_C.yellow : '#E5E0EE'}/>
              </svg>
            ))}
          </div>
        </div>
        <span style={{ fontFamily: MP_FONT, fontSize: 11, color: MP_C.text3, fontWeight: 600, flexShrink: 0 }}>{r.date}</span>
      </div>
      <p style={{
        margin: 0, fontFamily: MP_FONT, fontSize: 12.5, color: MP_C.text2, fontWeight: 500,
        lineHeight: 1.5, letterSpacing: -0.1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>{r.content}</p>
      {r.photos && (
        <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
          {r.photos.map((p, i) => (
            <div key={i} style={{
              width: 44, height: 44, borderRadius: 8, background: p, position: 'relative', overflow: 'hidden',
            }}>
              <svg width="100%" height="100%" viewBox="0 0 44 44" preserveAspectRatio="none">
                <defs>
                  <pattern id={`mr-rev-st-${r.id}-${i}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
                  </pattern>
                </defs>
                <rect width="44" height="44" fill={`url(#mr-rev-st-${r.id}-${i})`}/>
              </svg>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <span style={{ fontFamily: MP_FONT, fontSize: 11, fontWeight: 700, color: MP_C.text3, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <path d="M3 6.5l2 2v-5l1.6-2.2c.3-.4 1-.3 1.1.3l.3 2.2H10c.7 0 1.2.6 1 1.3l-1 4.4c-.1.6-.7 1-1.3 1H4c-.6 0-1-.4-1-1V6.5Z" stroke={MP_C.text3} strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          공감 {r.likes}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: 999, background: MP_C.text4 }}/>
        <button style={{
          background: 'none', border: 'none', padding: 0,
          fontFamily: MP_FONT, fontSize: 11, fontWeight: 700, color: MP_C.text3,
        }}>수정</button>
        <button style={{
          background: 'none', border: 'none', padding: 0,
          fontFamily: MP_FONT, fontSize: 11, fontWeight: 700, color: MP_C.text3,
        }}>삭제</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab bar (reusing main map tab bar style; "마이" active)
// ─────────────────────────────────────────────────────────────
function MyTabBar() {
  const items = [
    { id: 'map', label: '지도', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2" strokeLinejoin="round"/>
        <path d="M9 4v14M15 6v14" stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2"/>
      </svg>
    )},
    { id: 'fav', label: '찜', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"
              stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'home', label: '홈', icon: () => (
      <div style={{
        width: 52, height: 52, marginTop: -20, borderRadius: '50%',
        background: `linear-gradient(135deg, #9B6CFF, ${MP_C.primary})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(124,58,237,0.42)',
        border: '4px solid #fff',
      }}>
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
          <path d="M5 4 L21 4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
          <path d="M7 4 L7 8 M19 4 L19 8 M13 4 L13 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="13" cy="14" r="5" fill="#fff"/>
          <path d="M11 14h4" stroke={MP_C.primary} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    )},
    { id: 'event', label: '이벤트', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 10h16v10H4z" stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2"/>
        <path d="M3 7h18v3H3zM12 7v13M9 7s-3-3 0-3 3 3 3 3M15 7s3-3 0-3-3 3-3 3"
              stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'my', label: '마이', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? MP_C.primarySoft : 'none'}>
        <circle cx="12" cy="9" r="3.5" stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2"/>
        <path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke={a ? MP_C.primary : MP_C.text3} strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    )},
  ];
  const active = 'my';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      background: '#fff',
      paddingBottom: 22, paddingTop: 10,
      boxShadow: '0 -4px 18px rgba(31,17,68,0.08)',
      borderTop: `1px solid ${MP_C.line}`,
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
                fontFamily: MP_FONT, fontSize: 11, fontWeight: a ? 800 : 600,
                color: a ? MP_C.primary : MP_C.text3, letterSpacing: -0.2,
              }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main MyPage doc
// ─────────────────────────────────────────────────────────────
function MyPageDoc() {
  const myRegistered = [
    { id: 1, name: '인생네컷 강남역점', address: '서울 강남구 강남대로 123', tags: ['500원', '주차'], date: '11.04', status: '승인됨', statusFg: MP_C.green, statusBg: MP_C.greenSoft, thumbBg: 'linear-gradient(135deg,#9B6CFF,#7C3AED)' },
    { id: 2, name: '뽑기천국 신논현', address: '서울 강남구 봉은사로 45', tags: ['1000원', '대형'], date: '10.21', status: '검토중', statusFg: '#F59E0B', statusBg: '#FEF3C7', thumbBg: 'linear-gradient(135deg,#FF9DC0,#FF6B9D)' },
    { id: 3, name: '미니샵 테헤란', address: '서울 강남구 테헤란로 207', tags: ['500원', '24시간'], date: '09.15', status: '승인됨', statusFg: MP_C.green, statusBg: MP_C.greenSoft, thumbBg: 'linear-gradient(135deg,#FBBF24,#F59E0B)' },
  ];
  const liked = [
    { id: 1, name: '클로존 역삼점', address: '서울 강남구 역삼로 55', distance: '480m', rating: '4.6', reviews: 89, thumbBg: 'linear-gradient(135deg,#34D399,#10B981)' },
    { id: 2, name: '뽑기마스터 홍대', address: '서울 마포구 어울마당로 88', distance: '4.2km', rating: '4.7', reviews: 124, thumbBg: 'linear-gradient(135deg,#60A5FA,#2563EB)' },
    { id: 3, name: '코인뽑기 성수점', address: '서울 성동구 성수이로 12', distance: '6.8km', rating: '4.5', reviews: 67, thumbBg: 'linear-gradient(135deg,#F472B6,#DB2777)' },
  ];
  const reviews = [
    { id: 1, spot: '인생네컷 강남역점', rating: 5, date: '3일 전', likes: 24,
      content: '주말 저녁에 들렸는데 사람도 적당하고 기계 상태도 너무 좋았어요! 500원 기계가 많아서 부담 없이 즐길 수 있고...',
      photos: ['linear-gradient(135deg,#9B6CFF,#7C3AED)', 'linear-gradient(135deg,#FF9DC0,#FF6B9D)']
    },
    { id: 2, spot: '클로존 역삼점', rating: 4, date: '1주 전', likes: 8,
      content: '주차장이 넓어서 차 가져가도 편해요. 다만 인기 인형은 금방 빠져나가서 평일 낮에 가는 걸 추천!' },
    { id: 3, spot: '뽑기마스터 홍대', rating: 5, date: '2주 전', likes: 15,
      content: '신상 인형 종류가 진짜 많고 매주 바뀌어요. 홍대 데이트 코스로 강추합니다 🥰',
      photos: ['linear-gradient(135deg,#FBBF24,#F59E0B)']
    },
  ];

  return (
    <div style={{ background: MP_C.bg, padding: '14px 14px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ProfileCard/>
      <ActivityStats/>

      <SectionBlock icon="📍" title="내가 등록한 뽑기방" count={5}>
        {myRegistered.map((s, i) => <MyRegisteredRow key={s.id} spot={s} isLast={i === myRegistered.length - 1}/>)}
      </SectionBlock>

      <SectionBlock icon="💜" title="찜한 뽑기방" count={23}>
        {liked.map((s) => <LikedRow key={s.id} spot={s}/>)}
      </SectionBlock>

      <SectionBlock icon="✍️" title="내 후기" count={38}>
        {reviews.map((r) => <MyReviewRow key={r.id} r={r}/>)}
      </SectionBlock>

      {/* settings shortcut */}
      <div style={{
        background: '#fff', borderRadius: 18, overflow: 'hidden',
      }}>
        {[
          { icon: '🔔', label: '알림 설정', meta: '켜짐' },
          { icon: '🛡️', label: '신고 내역', meta: null },
          { icon: '❓', label: '도움말 · 문의', meta: null },
          { icon: 'ⓘ', label: '버전 정보', meta: 'v1.2.0' },
        ].map((it, i, arr) => (
          <div key={it.label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            borderTop: i > 0 ? `1px solid ${MP_C.line}` : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: MP_C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>{it.icon}</div>
            <div style={{ flex: 1, fontFamily: MP_FONT, fontSize: 14, fontWeight: 700, color: MP_C.text, letterSpacing: -0.2 }}>
              {it.label}
            </div>
            {it.meta && <span style={{ fontFamily: MP_FONT, fontSize: 11.5, color: MP_C.text3, fontWeight: 600 }}>{it.meta}</span>}
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke={MP_C.text4} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Phone frame
// ─────────────────────────────────────────────────────────────
function MyPagePhone({ scrollTop = 0 }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: '#fff',
      boxShadow: '0 30px 80px rgba(31,17,68,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: MP_FONT,
    }}>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 35, borderRadius: 22, background: '#000', zIndex: 100,
      }}/>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 30px 0', background: '#fff',
      }}>
        <div style={{ fontFamily: MP_FONT, fontSize: 15, fontWeight: 800, color: MP_C.text }}>9:41</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" fill={MP_C.text}/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0" stroke={MP_C.text} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1.2" fill={MP_C.text}/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={MP_C.text} fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill={MP_C.text}/><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={MP_C.text}/></svg>
        </div>
      </div>

      {/* page header */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, height: 56, zIndex: 50,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
        borderBottom: scrollTop > 4 ? `1px solid ${MP_C.line}` : '1px solid transparent',
      }}>
        <h1 style={{
          margin: 0, fontFamily: MP_FONT, fontSize: 19, fontWeight: 800,
          color: MP_C.text, letterSpacing: -0.4,
        }}>마이페이지</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          }}>
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
              <path d="M9.5 2c-3 0-5.5 2.5-5.5 5.5V11l-1.5 2.5h14L15 11V7.5C15 4.5 12.5 2 9.5 2Z" stroke={MP_C.text} strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M7.5 14.5c0 1 1 2 2 2s2-1 2-2" stroke={MP_C.text} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <span style={{
              position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
              background: MP_C.pink, border: '1.5px solid #fff',
            }}/>
          </button>
          <button style={{
            width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
              <circle cx="9.5" cy="9.5" r="2" stroke={MP_C.text} strokeWidth="1.6"/>
              <path d="M14.5 9.5l1.5-.5-.7-1.7L14 7.5M5 11.5L3.5 12l.7 1.7L5.7 13M9.5 14.5v1.7M9.5 2.8v1.7M14.5 9.5l1.5.5-.7 1.7-1.3-.2M5 7.5L3.5 7l.7-1.7L5.7 5.5M12.7 12.7l1.2 1.2 1.2-1.2-.7-1.2M5.5 4.7L4.3 3.5 3.1 4.7l.7 1.2"
                    stroke={MP_C.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* scroll viewport */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0, bottom: 84,
        overflow: 'hidden', background: MP_C.bg,
      }}>
        <div style={{ position: 'absolute', top: -scrollTop, left: 0, right: 0 }}>
          <MyPageDoc/>
        </div>
      </div>

      <MyTabBar/>

      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.35)', zIndex: 100,
      }}/>
    </div>
  );
}

window.MyPagePhone = MyPagePhone;
