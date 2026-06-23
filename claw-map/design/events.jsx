/* global React */
// Events tab — 클로맵
// Two states: list (scrolled) and detail (full-screen). 390x844.

const EV_C = {
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
  red: '#EF4444',
  redSoft: '#FEE2E2',
  green: '#10B981',
  greenSoft: '#DCFCE7',
};
const EV_FONT = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

// Stripe-pattern thumbnail (no real images)
function EvThumb({ id, gradient, label, ratio = '16/9', muted = false }) {
  const [w, h] = ratio === '16/9' ? [320, 180] : [180, 180];
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: ratio,
      borderRadius: 14, overflow: 'hidden',
      background: gradient,
      filter: muted ? 'grayscale(0.85) brightness(0.95)' : 'none',
    }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <pattern id={`ev-st-${id}`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.3)" strokeWidth="5"/>
          </pattern>
          <radialGradient id={`ev-rg-${id}`} cx="30%" cy="30%" r="80%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </radialGradient>
        </defs>
        <rect width={w} height={h} fill={`url(#ev-st-${id})`}/>
        <rect width={w} height={h} fill={`url(#ev-rg-${id})`}/>
      </svg>
      {/* sparkle deco */}
      <div style={{
        position: 'absolute', top: 12, right: 14, color: 'rgba(255,255,255,0.85)',
        fontSize: 18,
      }}>✨</div>
      {/* mono label */}
      <div style={{
        position: 'absolute', bottom: 10, left: 12,
        fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
        fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero "highlight" banner for top of list
// ─────────────────────────────────────────────────────────────
function EventHero() {
  return (
    <div style={{
      position: 'relative', borderRadius: 22, overflow: 'hidden',
      background: `linear-gradient(135deg, #FF8FB1 0%, #9B6CFF 55%, ${EV_C.primary} 100%)`,
      boxShadow: '0 14px 30px rgba(124,58,237,0.28)',
      padding: '18px 18px 16px',
      color: '#fff',
    }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', top: -50, right: -50, opacity: 0.18 }}>
        <circle cx="100" cy="100" r="100" fill="#fff"/>
      </svg>
      <div style={{ position: 'absolute', top: 18, right: 70, fontSize: 16, opacity: 0.7 }}>✦</div>
      <div style={{ position: 'absolute', top: 56, right: 26, fontSize: 12, opacity: 0.5 }}>✧</div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,255,255,0.95)', color: EV_C.primaryDark,
            fontFamily: EV_FONT, fontSize: 10.5, fontWeight: 800,
            padding: '3px 9px', borderRadius: 999, letterSpacing: 0.2,
          }}>🎉 HOT 이벤트</span>
          <h2 style={{
            margin: '10px 0 6px', fontFamily: EV_FONT, fontSize: 19, fontWeight: 800,
            color: '#fff', letterSpacing: -0.4, lineHeight: 1.25,
          }}>여름맞이 인증샷<br/>대잔치 🏖️</h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: EV_FONT, fontSize: 11.5, fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
          }}>
            <span>~2026.07.31</span>
            <span style={{ width: 3, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.5)' }}/>
            <span>참여 1,284명</span>
          </div>
        </div>
        <div style={{
          flexShrink: 0, padding: '7px 11px', borderRadius: 12,
          background: '#fff', color: EV_C.red,
          fontFamily: EV_FONT, fontSize: 13, fontWeight: 800,
          textAlign: 'center', lineHeight: 1, letterSpacing: -0.3,
        }}>
          <div style={{ fontSize: 9, color: EV_C.text3, fontWeight: 700, marginBottom: 3 }}>마감까지</div>
          D-23
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Active event card
// ─────────────────────────────────────────────────────────────
function ActiveEventCard({ ev }) {
  return (
    <div style={{
      position: 'relative', background: '#fff', borderRadius: 18, overflow: 'hidden',
      borderLeft: `4px solid ${EV_C.primary}`,
      boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
    }}>
      <div style={{ display: 'flex', gap: 12, padding: '14px 14px 14px 12px' }}>
        <div style={{ width: 96, height: 96, borderRadius: 14, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
          <EvThumb id={ev.id} gradient={ev.gradient} label={ev.thumbLabel} ratio="1/1" />
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: EV_C.red, color: '#fff',
            fontFamily: EV_FONT, fontSize: 10, fontWeight: 800,
            padding: '2px 6px', borderRadius: 5, letterSpacing: -0.2,
          }}>D-{ev.dday}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontFamily: EV_FONT, fontSize: 10, fontWeight: 800, color: EV_C.green,
              background: EV_C.greenSoft, padding: '2px 6px', borderRadius: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: EV_C.green }}/>
              진행중
            </span>
            {ev.tag && (
              <span style={{
                fontFamily: EV_FONT, fontSize: 10, fontWeight: 800, color: EV_C.primaryDark,
                background: EV_C.primarySoft, padding: '2px 6px', borderRadius: 5,
              }}>{ev.tag}</span>
            )}
          </div>
          <h3 style={{
            margin: 0, fontFamily: EV_FONT, fontSize: 14.5, fontWeight: 800,
            color: EV_C.text, lineHeight: 1.3, letterSpacing: -0.2,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{ev.title}</h3>
          <div style={{
            marginTop: 6, fontFamily: EV_FONT, fontSize: 11.5, fontWeight: 600,
            color: EV_C.text3,
          }}>~{ev.endDate}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{
              fontFamily: EV_FONT, fontSize: 11, fontWeight: 700, color: EV_C.text2,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="4.5" r="2" stroke={EV_C.text2} strokeWidth="1.3"/>
                <path d="M2 11c0-2 2-3 4-3s4 1 4 3" stroke={EV_C.text2} strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {ev.participants}
            </span>
            <span style={{
              fontFamily: EV_FONT, fontSize: 11, fontWeight: 700, color: EV_C.text2,
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path d="M2 3.5c0-.5.4-1 1-1h6c.6 0 1 .5 1 1v4c0 .6-.4 1-1 1H6L4 10V8.5H3c-.6 0-1-.4-1-1v-4Z" stroke={EV_C.text2} strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              {ev.comments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ended event card (smaller, muted)
// ─────────────────────────────────────────────────────────────
function EndedEventCard({ ev }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: `1px solid ${EV_C.line}` }}>
      <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <EvThumb id={`end-${ev.id}`} gradient={ev.gradient} label={ev.thumbLabel} ratio="1/1" muted/>
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(26,22,38,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: EV_FONT, fontSize: 9.5, fontWeight: 800, color: '#fff',
            background: 'rgba(0,0,0,0.45)', padding: '2px 6px', borderRadius: 4,
            letterSpacing: 0.3,
          }}>END</span>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontFamily: EV_FONT, fontSize: 10, fontWeight: 800, color: EV_C.text3,
          background: '#F1EEF6', padding: '2px 6px', borderRadius: 5, marginBottom: 4,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: EV_C.text3 }}/>
          종료
        </div>
        <h4 style={{
          margin: 0, fontFamily: EV_FONT, fontSize: 13.5, fontWeight: 700,
          color: EV_C.text2, lineHeight: 1.3, letterSpacing: -0.2,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{ev.title}</h4>
        <div style={{
          marginTop: 5, display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: EV_FONT, fontSize: 10.5, fontWeight: 600, color: EV_C.text3,
        }}>
          <span>~{ev.endDate}</span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: EV_C.text4 }}/>
          <span>참여 {ev.participants}명</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Events list document
// ─────────────────────────────────────────────────────────────
function EventListDoc() {
  const active = [
    { id: 1, title: '인생샷 인형 자랑하기 챌린지', endDate: '2026.07.15', dday: 7, participants: 542, comments: 128,
      tag: '🎁 추첨',
      gradient: 'linear-gradient(135deg, #FF9DC0 0%, #FF6B9D 100%)', thumbLabel: 'PHOTO CHALLENGE' },
    { id: 2, title: '500원 한 판으로 인형 뽑기 인증', endDate: '2026.07.31', dday: 23, participants: 1284, comments: 312,
      tag: '🔥 1+1',
      gradient: 'linear-gradient(135deg, #9B6CFF 0%, #7C3AED 100%)', thumbLabel: '500WON FESTIVAL' },
    { id: 3, title: '신상 인형 발견 제보 이벤트', endDate: '2026.08.10', dday: 33, participants: 87, comments: 24,
      tag: '✨ NEW',
      gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)', thumbLabel: 'NEW DISCOVERY' },
  ];
  const ended = [
    { id: 4, title: '6월의 럭키 뽑기왕 선발', endDate: '2026.06.30', participants: 3024,
      gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', thumbLabel: 'JUNE WINNER' },
    { id: 5, title: '클로맵 오픈 100일 기념 이벤트', endDate: '2026.06.15', participants: 5921,
      gradient: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)', thumbLabel: 'OPEN 100' },
    { id: 6, title: '뽑기방 첫 후기 작성하면 5,000P', endDate: '2026.05.31', participants: 1820,
      gradient: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)', thumbLabel: 'FIRST REVIEW' },
  ];
  return (
    <div style={{ background: EV_C.bg, padding: '14px 14px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EventHero/>

      {/* 진행중 */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px 10px',
        }}>
          <h3 style={{
            margin: 0, fontFamily: EV_FONT, fontSize: 16, fontWeight: 800,
            color: EV_C.text, letterSpacing: -0.3,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            진행중 🔥
            <span style={{
              fontFamily: EV_FONT, fontSize: 12, fontWeight: 800, color: EV_C.primary,
              background: EV_C.primaryFaint, padding: '2px 8px', borderRadius: 999,
            }}>3</span>
          </h3>
          <button style={{
            background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 2,
            fontFamily: EV_FONT, fontSize: 12, fontWeight: 700, color: EV_C.text3,
          }}>
            최신순
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M3 4.5l2.5 2.5L8 4.5" stroke={EV_C.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {active.map(ev => <ActiveEventCard key={ev.id} ev={ev}/>)}
        </div>
      </div>

      {/* 종료 */}
      <div style={{
        background: '#fff', borderRadius: 18, padding: '4px 16px 14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 0 4px',
        }}>
          <h3 style={{
            margin: 0, fontFamily: EV_FONT, fontSize: 15.5, fontWeight: 800,
            color: EV_C.text2, letterSpacing: -0.3,
          }}>종료된 이벤트</h3>
          <button style={{
            background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 2,
            fontFamily: EV_FONT, fontSize: 12, fontWeight: 700, color: EV_C.text3,
          }}>
            전체보기
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M4 3l3 2.5-3 2.5" stroke={EV_C.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        {ended.map(ev => <EndedEventCard key={ev.id} ev={ev}/>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab bar (events active)
// ─────────────────────────────────────────────────────────────
function EventTabBar() {
  const items = [
    { id: 'map', label: '지도', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2" strokeLinejoin="round"/>
        <path d="M9 4v14M15 6v14" stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2"/>
      </svg>
    )},
    { id: 'fav', label: '찜', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"
              stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'home', label: '홈', icon: () => (
      <div style={{
        width: 52, height: 52, marginTop: -20, borderRadius: '50%',
        background: `linear-gradient(135deg, #9B6CFF, ${EV_C.primary})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(124,58,237,0.42)',
        border: '4px solid #fff',
      }}>
        <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
          <path d="M5 4 L21 4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
          <path d="M7 4 L7 8 M19 4 L19 8 M13 4 L13 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="13" cy="14" r="5" fill="#fff"/>
          <path d="M11 14h4" stroke={EV_C.primary} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
    )},
    { id: 'event', label: '이벤트', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? EV_C.primarySoft : 'none'}>
        <path d="M4 10h16v10H4z" stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2"/>
        <path d="M3 7h18v3H3zM12 7v13M9 7s-3-3 0-3 3 3 3 3M15 7s3-3 0-3-3 3-3 3"
              stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    )},
    { id: 'my', label: '마이', icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="3.5" stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2"/>
        <path d="M5 20c1-4 4-6 7-6s6 2 7 6" stroke={a ? EV_C.primary : EV_C.text3} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )},
  ];
  const active = 'event';
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      background: '#fff',
      paddingBottom: 22, paddingTop: 10,
      boxShadow: '0 -4px 18px rgba(31,17,68,0.08)',
      borderTop: `1px solid ${EV_C.line}`,
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
                fontFamily: EV_FONT, fontSize: 11, fontWeight: a ? 800 : 600,
                color: a ? EV_C.primary : EV_C.text3, letterSpacing: -0.2,
              }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LIST PHONE
// ─────────────────────────────────────────────────────────────
function EventListPhone() {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: '#fff',
      boxShadow: '0 30px 80px rgba(31,17,68,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: EV_FONT,
    }}>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 35, borderRadius: 22, background: '#000', zIndex: 100,
      }}/>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 30px 0', background: '#fff',
      }}>
        <div style={{ fontFamily: EV_FONT, fontSize: 15, fontWeight: 800, color: EV_C.text }}>9:41</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" fill={EV_C.text}/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0" stroke={EV_C.text} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1.2" fill={EV_C.text}/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={EV_C.text} fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill={EV_C.text}/><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={EV_C.text}/></svg>
        </div>
      </div>

      {/* page header */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, height: 56, zIndex: 50,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
      }}>
        <h1 style={{
          margin: 0, fontFamily: EV_FONT, fontSize: 19, fontWeight: 800,
          color: EV_C.text, letterSpacing: -0.4,
        }}>이벤트</h1>
        <button style={{
          width: 40, height: 40, borderRadius: 12, background: 'transparent', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
            <path d="M9.5 2c-3 0-5.5 2.5-5.5 5.5V11l-1.5 2.5h14L15 11V7.5C15 4.5 12.5 2 9.5 2Z" stroke={EV_C.text} strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M7.5 14.5c0 1 1 2 2 2s2-1 2-2" stroke={EV_C.text} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <span style={{
            position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%',
            background: EV_C.pink, border: '1.5px solid #fff',
          }}/>
        </button>
      </div>

      {/* scroll */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0, bottom: 84,
        overflow: 'hidden', background: EV_C.bg,
      }}>
        <EventListDoc/>
      </div>

      <EventTabBar/>

      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.35)', zIndex: 100,
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EVENT DETAIL
// ─────────────────────────────────────────────────────────────
function EventDetailPhone() {
  const comments = [
    { id: 1, name: '뽑기왕민지', time: '5분 전', avatar: 'linear-gradient(135deg,#FF9DC0,#FF6B9D)', initial: '민',
      text: '오늘 강남역점에서 라이언 인형 한 번에 뽑았어요!! 사진 남겨두고 갑니다 🥰', likes: 12, mine: false },
    { id: 2, name: '코인헌터', time: '32분 전', avatar: 'linear-gradient(135deg,#34D399,#10B981)', initial: '코',
      text: '500원 기계 위주로 도는데 이번 주만 8개 성공했네요. 신논현점 추천드립니다!', likes: 8, mine: false, badge: 'TOP' },
    { id: 3, name: '뽑기초보', time: '1시간 전', avatar: 'linear-gradient(135deg,#FBBF24,#F59E0B)', initial: '뽑',
      text: '저도 도전해볼게요! 어디 뽑기방이 제일 잘 뽑히나요?', likes: 3, mine: false },
    { id: 4, name: '인형수집가', time: '2시간 전', avatar: 'linear-gradient(135deg,#9B6CFF,#7C3AED)', initial: '인',
      text: '5번째 도전 끝에 성공!! 진짜 짜릿하네요. 이벤트 덕에 더 신남 ㅋㅋ', likes: 24, mine: false },
  ];
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: '#fff',
      boxShadow: '0 30px 80px rgba(31,17,68,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: EV_FONT,
    }}>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 35, borderRadius: 22, background: '#000', zIndex: 100,
      }}/>

      {/* status bar (transparent over hero) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 54, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 30px 0',
      }}>
        <div style={{ fontFamily: EV_FONT, fontSize: 15, fontWeight: 800, color: '#fff' }}>9:41</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" fill="#fff"/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1.2" fill="#fff"/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="#fff" fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill="#fff"/><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill="#fff"/></svg>
        </div>
      </div>

      {/* nav overlay */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, height: 56, zIndex: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
      }}>
        <button style={{
          width: 40, height: 40, borderRadius: 14,
          background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4 L6 9 L11 14" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <circle cx="13" cy="4" r="2" stroke="#fff" strokeWidth="1.6"/>
              <circle cx="5" cy="9" r="2" stroke="#fff" strokeWidth="1.6"/>
              <circle cx="13" cy="14" r="2" stroke="#fff" strokeWidth="1.6"/>
              <path d="M7 8L11 5M7 10L11 13" stroke="#fff" strokeWidth="1.6"/>
            </svg>
          </button>
          <button style={{
            width: 40, height: 40, borderRadius: 14,
            background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="4" r="1.4" fill="#fff"/>
              <circle cx="9" cy="9" r="1.4" fill="#fff"/>
              <circle cx="9" cy="14" r="1.4" fill="#fff"/>
            </svg>
          </button>
        </div>
      </div>

      {/* scroll body */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 72,
        overflow: 'hidden', background: EV_C.bg,
      }}>
        {/* hero image */}
        <div style={{
          position: 'relative', height: 320, width: '100%',
          background: 'linear-gradient(135deg, #FF8FB1 0%, #9B6CFF 50%, #7C3AED 100%)',
          overflow: 'hidden',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 390 320" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="ev-hero-st" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="22" stroke="rgba(255,255,255,0.18)" strokeWidth="6"/>
              </pattern>
              <radialGradient id="ev-hero-rg" cx="30%" cy="30%" r="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)"/>
                <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
              </radialGradient>
            </defs>
            <rect width="390" height="320" fill="url(#ev-hero-st)"/>
            <rect width="390" height="320" fill="url(#ev-hero-rg)"/>
          </svg>
          {/* deco */}
          <div style={{ position: 'absolute', top: 130, left: 50, fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>✨</div>
          <div style={{ position: 'absolute', top: 200, right: 70, fontSize: 22, color: 'rgba(255,255,255,0.85)' }}>🎀</div>
          <div style={{ position: 'absolute', top: 165, right: 30, fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>✦</div>
          <div style={{ position: 'absolute', top: 260, left: 30, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>✧</div>
          {/* center focal mono label */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
            fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: 1,
          }}>HERO IMAGE / 16:9</div>
          {/* gradient fade at bottom for content readability */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 80,
            background: 'linear-gradient(to bottom, rgba(245,244,248,0), rgba(245,244,248,1))',
          }}/>
          {/* photo indicator */}
          <div style={{
            position: 'absolute', bottom: 92, right: 16,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
            color: '#fff', fontFamily: EV_FONT, fontSize: 10.5, fontWeight: 700,
            padding: '3px 8px', borderRadius: 999,
          }}>1 / 3</div>
        </div>

        {/* content */}
        <div style={{ padding: '4px 18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* title block */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontFamily: EV_FONT, fontSize: 11, fontWeight: 800, color: EV_C.green,
                background: EV_C.greenSoft, padding: '3px 8px', borderRadius: 6,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: EV_C.green }}/>
                진행중
              </span>
              <span style={{
                fontFamily: EV_FONT, fontSize: 11, fontWeight: 800, color: EV_C.primaryDark,
                background: EV_C.primarySoft, padding: '3px 8px', borderRadius: 6,
              }}>🔥 1+1</span>
              <span style={{
                fontFamily: EV_FONT, fontSize: 11, fontWeight: 800, color: '#fff',
                background: EV_C.red, padding: '3px 8px', borderRadius: 6, marginLeft: 'auto',
              }}>D-23</span>
            </div>
            <h2 style={{
              margin: 0, fontFamily: EV_FONT, fontSize: 21, fontWeight: 800,
              color: EV_C.text, lineHeight: 1.3, letterSpacing: -0.5,
            }}>500원 한 판으로 인형 뽑기 인증 챌린지 🪙</h2>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginTop: 12, paddingTop: 12, borderTop: `1px solid ${EV_C.line}`,
              fontFamily: EV_FONT, fontSize: 12.5, fontWeight: 600, color: EV_C.text2,
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="3" width="10" height="9" rx="1.5" stroke={EV_C.text2} strokeWidth="1.4"/>
                  <path d="M2 6h10M5 1.5v3M9 1.5v3" stroke={EV_C.text2} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                2026.07.01 ~ 07.31
              </span>
              <span style={{ width: 3, height: 3, borderRadius: 999, background: EV_C.text4 }}/>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="5" r="2.4" stroke={EV_C.text2} strokeWidth="1.4"/>
                  <path d="M2 13c0-2.5 2-4 5-4s5 1.5 5 4" stroke={EV_C.text2} strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                참여 1,284명
              </span>
            </div>
            {/* operator */}
            <div style={{
              marginTop: 12, padding: '10px 12px', borderRadius: 12,
              background: EV_C.primaryFaint,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, #9B6CFF, ${EV_C.primary})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontFamily: EV_FONT, fontSize: 13, fontWeight: 800,
              }}>C</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: EV_FONT, fontSize: 12.5, fontWeight: 800, color: EV_C.primaryDark,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  클로맵 공식
                  <svg width="11" height="11" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="6" fill={EV_C.primary}/>
                    <path d="M3.5 6L5 7.5 8.5 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <div style={{ fontFamily: EV_FONT, fontSize: 11, color: EV_C.text3, fontWeight: 600, marginTop: 1 }}>
                  채널 운영자 · 5일 전 등록
                </div>
              </div>
            </div>
          </div>

          {/* event description */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '18px' }}>
            <h3 style={{
              margin: '0 0 10px', fontFamily: EV_FONT, fontSize: 14, fontWeight: 800, color: EV_C.text,
              letterSpacing: -0.2,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 4, height: 14, borderRadius: 2, background: EV_C.primary }}/>
              이벤트 안내
            </h3>
            <p style={{
              margin: 0, fontFamily: EV_FONT, fontSize: 13.5, fontWeight: 500, color: EV_C.text2,
              lineHeight: 1.65, letterSpacing: -0.1, whiteSpace: 'pre-line',
            }}>
              500원 한 판으로 인형을 뽑으셨다면, 그 인증샷을 댓글로 공유해주세요!
              매주 금요일 추첨을 통해 5분께 스타벅스 1만원권을 드립니다 ☕
            </p>

            <h3 style={{
              margin: '20px 0 10px', fontFamily: EV_FONT, fontSize: 14, fontWeight: 800, color: EV_C.text,
              letterSpacing: -0.2,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 4, height: 14, borderRadius: 2, background: EV_C.primary }}/>
              참여 방법
            </h3>
            <ol style={{
              margin: 0, paddingLeft: 0, listStyle: 'none',
              fontFamily: EV_FONT, fontSize: 13, fontWeight: 600, color: EV_C.text2,
              lineHeight: 1.6,
            }}>
              {[
                '클로맵에서 뽑기방을 검색하고 방문하기',
                '500원 기계로 인형 뽑기 도전!',
                '성공한 인형과 영수증을 함께 댓글 등록',
                '#500원챌린지 해시태그 필수',
              ].map((s, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, padding: '7px 0' }}>
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    background: EV_C.primaryFaint, color: EV_C.primaryDark,
                    fontFamily: EV_FONT, fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{i + 1}</span>
                  <span style={{ paddingTop: 1 }}>{s}</span>
                </li>
              ))}
            </ol>

            {/* prize highlight */}
            <div style={{
              marginTop: 16, padding: '12px 14px', borderRadius: 14,
              background: 'linear-gradient(135deg, #FFF7E5, #FFE5EE)',
              border: '1px dashed rgba(124,58,237,0.3)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 26 }}>🎁</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: EV_FONT, fontSize: 11, fontWeight: 800, color: EV_C.primaryDark,
                  letterSpacing: 0.3,
                }}>경품</div>
                <div style={{
                  fontFamily: EV_FONT, fontSize: 14, fontWeight: 800, color: EV_C.text,
                  letterSpacing: -0.2, marginTop: 2,
                }}>스타벅스 1만원권 × 5명</div>
                <div style={{ fontFamily: EV_FONT, fontSize: 11, fontWeight: 600, color: EV_C.text3, marginTop: 2 }}>
                  매주 금요일 오후 6시 추첨 발표
                </div>
              </div>
            </div>
          </div>

          {/* comments */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{
                margin: 0, fontFamily: EV_FONT, fontSize: 14, fontWeight: 800, color: EV_C.text,
                letterSpacing: -0.2,
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 4, height: 14, borderRadius: 2, background: EV_C.primary }}/>
                참여 댓글
                <span style={{
                  fontFamily: EV_FONT, fontSize: 11, fontWeight: 800, color: EV_C.primary,
                  background: EV_C.primaryFaint, padding: '2px 7px', borderRadius: 999,
                }}>312</span>
              </h3>
              <button style={{
                background: 'none', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 2,
                fontFamily: EV_FONT, fontSize: 11.5, fontWeight: 700, color: EV_C.text3,
              }}>
                인기순
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M3 4.5l2.5 2.5L8 4.5" stroke={EV_C.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {comments.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', gap: 10,
                  paddingTop: i === 0 ? 0 : 14,
                  borderTop: i === 0 ? 'none' : `1px solid ${EV_C.line}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: c.avatar,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontFamily: EV_FONT, fontSize: 13, fontWeight: 800,
                  }}>{c.initial}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: EV_FONT, fontSize: 12.5, fontWeight: 800, color: EV_C.text }}>{c.name}</span>
                      {c.badge && (
                        <span style={{
                          fontFamily: EV_FONT, fontSize: 9, fontWeight: 800, color: EV_C.primaryDark,
                          background: EV_C.primarySoft, padding: '1px 5px', borderRadius: 4,
                        }}>{c.badge}</span>
                      )}
                      <span style={{ fontFamily: EV_FONT, fontSize: 11, color: EV_C.text3, fontWeight: 600 }}>· {c.time}</span>
                    </div>
                    <p style={{
                      margin: '4px 0 0', fontFamily: EV_FONT, fontSize: 12.5, fontWeight: 500,
                      color: EV_C.text2, lineHeight: 1.55, letterSpacing: -0.1,
                    }}>{c.text}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 7 }}>
                      <button style={{
                        background: 'none', border: 'none', padding: 0,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontFamily: EV_FONT, fontSize: 11, fontWeight: 700, color: EV_C.text3,
                      }}>
                        <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                          <path d="M3 7l2 2v-5l1.6-2.2c.3-.4 1-.3 1.1.3l.3 2.2H10c.7 0 1.2.6 1 1.3l-1 4.4c-.1.6-.7 1-1.3 1H4c-.6 0-1-.4-1-1V7Z" stroke={EV_C.text3} strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                        {c.likes}
                      </button>
                      <button style={{
                        background: 'none', border: 'none', padding: 0,
                        fontFamily: EV_FONT, fontSize: 11, fontWeight: 700, color: EV_C.text3,
                      }}>답글</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* fixed comment input */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: 72, background: '#fff',
        borderTop: `1px solid ${EV_C.line}`,
        boxShadow: '0 -4px 18px rgba(31,17,68,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px 18px',
        zIndex: 50,
      }}>
        <button style={{
          width: 36, height: 36, borderRadius: 12,
          background: EV_C.bg, border: 'none', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="5" width="14" height="11" rx="1.6" stroke={EV_C.text2} strokeWidth="1.6"/>
            <circle cx="13" cy="9" r="1.5" fill={EV_C.text2}/>
            <path d="M3 14l4-4 4 4 3-3 3 3" stroke={EV_C.text2} strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
        <div style={{
          flex: 1, height: 44, borderRadius: 999,
          background: EV_C.bg,
          display: 'flex', alignItems: 'center',
          padding: '0 14px',
          fontFamily: EV_FONT, fontSize: 13, fontWeight: 600, color: EV_C.text3,
        }}>
          이벤트에 참여해보세요!
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: '50%',
          background: `linear-gradient(135deg, #9B6CFF, ${EV_C.primary})`,
          border: 'none', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 14px rgba(124,58,237,0.4)',
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 10L17 3 12 17 10 11 3 10Z" fill="#fff"/>
          </svg>
        </button>
      </div>

      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.35)', zIndex: 100,
      }}/>
    </div>
  );
}

window.EventListPhone = EventListPhone;
window.EventDetailPhone = EventDetailPhone;
