/* global React, ReactDOM */
// 오뽑세 — landing page
// Reuses phone components exposed by claw-map-screens / spot-detail / spot-register / my-page / events

const L = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryDarker: '#5B21B6',
  primarySoft: '#EDE7FF',
  primaryFaint: '#F6F2FF',
  ink: '#1A1626',
  ink2: '#3D3454',
  text2: '#5B5470',
  text3: '#9B94AD',
  text4: '#C8C2D6',
  line: '#EDEAF2',
  bg: '#F7F5FA',
  yellow: '#FBBF24',
  pink: '#FF6B9D',
  green: '#10B981',
  red: '#EF4444',
};
const FF = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
const MAP_URL = 'index.html'; // 프로덕션: /map

// ─────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────
function Logo({ size = 28, color = L.primary }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <div style={{
        width: size + 8, height: size + 8, borderRadius: 12,
        background: `linear-gradient(135deg, #9B6CFF, ${color})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 14px rgba(124,58,237,0.32)',
      }}>
        <svg width={size - 4} height={size - 4} viewBox="0 0 26 26" fill="none">
          <path d="M5 4 L21 4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/>
          <path d="M7 4 L7 8 M19 4 L19 8 M13 4 L13 8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
          <circle cx="13" cy="14" r="5" fill="#fff"/>
          <path d="M11 14h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div style={{
        fontFamily: FF, fontSize: 19, fontWeight: 900, color: L.ink,
        letterSpacing: -0.6,
      }}>오뽑세</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(247,245,250,0.85)',
      backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
      borderBottom: `1px solid ${L.line}`,
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto', padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <a href="#features" style={{
            padding: '8px 14px', fontFamily: FF, fontSize: 14, fontWeight: 700,
            color: L.text2, borderRadius: 10,
          }}>기능</a>
          <a href="#preview" style={{
            padding: '8px 14px', fontFamily: FF, fontSize: 14, fontWeight: 700,
            color: L.text2, borderRadius: 10,
          }}>화면 미리보기</a>
          <a href="#channel" style={{
            padding: '8px 14px', fontFamily: FF, fontSize: 14, fontWeight: 700,
            color: L.text2, borderRadius: 10,
          }}>유튜브 채널</a>
          <a href={MAP_URL} style={{
            marginLeft: 8, padding: '10px 18px', borderRadius: 999,
            background: L.ink, color: '#fff',
            fontFamily: FF, fontSize: 13.5, fontWeight: 800, letterSpacing: -0.2,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            지도 바로가기
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2.5l4 3.5-4 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '64px 28px 96px',
    }}>
      {/* gradient mesh background */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 1400, height: 700, pointerEvents: 'none',
        background: 'radial-gradient(60% 60% at 20% 50%, rgba(155,108,255,0.22), transparent 70%), radial-gradient(50% 50% at 80% 40%, rgba(255,107,157,0.16), transparent 70%), radial-gradient(40% 40% at 60% 80%, rgba(251,191,36,0.12), transparent 70%)',
        filter: 'blur(4px)',
      }}/>
      {/* dotted grid */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none' }}>
        <defs>
          <pattern id="hero-dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#C8C2D6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)"/>
      </svg>

      <div style={{
        position: 'relative', maxWidth: 1240, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 56,
        alignItems: 'center',
      }}>
        {/* left — copy */}
        <div>
          {/* badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '7px 14px', borderRadius: 999,
            background: '#fff',
            border: `1px solid ${L.line}`,
            boxShadow: '0 4px 12px rgba(31,17,68,0.06)',
            fontFamily: FF, fontSize: 12.5, fontWeight: 700, color: L.ink2,
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: L.red,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="#fff">
                <path d="M5 2 L5 10 L10 6 Z"/>
              </svg>
            </span>
            유튜브 채널 <b style={{ color: L.red, marginLeft: -2 }}>오뽑세</b> 공식 지도
          </div>

          <h1 style={{
            margin: '24px 0 0', fontFamily: FF,
            fontSize: 68, lineHeight: 1.1, letterSpacing: -2.2,
            fontWeight: 900, color: L.ink, textWrap: 'pretty',
          }}>
            내 근처<br/>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              인형뽑기방
              {/* underline doodle */}
              <svg width="100%" height="14" viewBox="0 0 320 14" preserveAspectRatio="none"
                   style={{ position: 'absolute', left: 0, bottom: -2 }}>
                <path d="M2 8 Q80 1 160 7 T318 6" fill="none" stroke={L.primary} strokeWidth="6" strokeLinecap="round"/>
              </svg>
            </span>,<br/>
            <span style={{ color: L.primary }}>한눈에</span>
          </h1>
          <p style={{
            margin: '24px 0 0', fontFamily: FF, fontSize: 18,
            lineHeight: 1.55, color: L.text2, fontWeight: 500,
            maxWidth: 480, letterSpacing: -0.3,
          }}>
            전국 뽑기방을 지도에서 찾고,
            <br/>찐 후기로 검증하고, 직접 등록하는 커뮤니티.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: 'wrap' }}>
            <a href={MAP_URL} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 58, padding: '0 26px', borderRadius: 16,
              background: `linear-gradient(135deg, #9B6CFF, ${L.primary})`,
              color: '#fff', fontFamily: FF, fontSize: 16, fontWeight: 800, letterSpacing: -0.3,
              boxShadow: '0 12px 28px rgba(124,58,237,0.38)',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5c0-3-2.5-5.5-5.5-5.5Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="2" fill="#fff"/>
              </svg>
              지도 바로가기
            </a>
            <a href="#features" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 58, padding: '0 22px', borderRadius: 16,
              background: '#fff', color: L.ink,
              border: `1.5px solid ${L.line}`,
              fontFamily: FF, fontSize: 15, fontWeight: 800, letterSpacing: -0.2,
            }}>
              어떻게 작동하나요
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke={L.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* sub url */}
          <div style={{
            marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 13, fontWeight: 600, color: L.text3,
            padding: '8px 14px', background: '#fff', borderRadius: 10,
            border: `1px dashed ${L.text4}`,
          }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke={L.text3} strokeWidth="1.4"/>
              <path d="M1.5 7h11M7 1.5c2 2 2 9 0 11M7 1.5c-2 2-2 9 0 11" stroke={L.text3} strokeWidth="1.4"/>
            </svg>
            map.chanyeols.com
          </div>
        </div>

        {/* right — phone */}
        <HeroPhone/>
      </div>
    </section>
  );
}

function HeroPhone() {
  return (
    <div style={{
      position: 'relative', height: 720,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* floating chips */}
      <div style={{
        position: 'absolute', top: 80, left: -10, zIndex: 5,
        background: '#fff', borderRadius: 16,
        boxShadow: '0 14px 30px rgba(31,17,68,0.12)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        transform: 'rotate(-3deg)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: 'linear-gradient(135deg,#FF9DC0,#FF6B9D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🎯</div>
        <div>
          <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 800, color: L.ink, letterSpacing: -0.2 }}>OO오락실 강남역점</div>
          <div style={{ fontFamily: FF, fontSize: 10.5, fontWeight: 700, color: L.green, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: L.green }}/>
            120m · 영업중
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 240, right: -20, zIndex: 5,
        background: '#fff', borderRadius: 16,
        boxShadow: '0 14px 30px rgba(31,17,68,0.12)',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        transform: 'rotate(3deg)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,#9B6CFF,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: FF, fontSize: 14, fontWeight: 800,
        }}>민</div>
        <div>
          <div style={{ fontFamily: FF, fontSize: 12, fontWeight: 800, color: L.ink, letterSpacing: -0.2 }}>
            <span style={{ display: 'inline-flex', gap: 1, marginRight: 4 }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="9" height="9" viewBox="0 0 13 13"><path d="M6.5 1l1.7 3.5 3.8.5-2.8 2.7.7 3.8L6.5 9.7l-3.4 1.8.7-3.8L1 5l3.8-.5L6.5 1Z" fill={L.yellow}/></svg>
              ))}
            </span>
            5점 후기
          </div>
          <div style={{ fontFamily: FF, fontSize: 10.5, fontWeight: 600, color: L.text2, marginTop: 2 }}>
            "1,000원에 라이언 뽑았어요!"
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 100, left: 10, zIndex: 5,
        background: '#fff', borderRadius: 16,
        boxShadow: '0 14px 30px rgba(31,17,68,0.12)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        transform: 'rotate(-2deg)',
      }}>
        <span style={{ fontSize: 18 }}>🎁</span>
        <div>
          <div style={{ fontFamily: FF, fontSize: 11.5, fontWeight: 800, color: L.ink }}>
            500원 챌린지 이벤트
          </div>
          <div style={{ fontFamily: FF, fontSize: 10, fontWeight: 700, color: L.red, marginTop: 1 }}>
            D-23 · 참여 1,284명
          </div>
        </div>
      </div>

      {/* decoration sparkles */}
      <div style={{ position: 'absolute', top: 20, right: 60, fontSize: 26, opacity: 0.7 }}>✨</div>
      <div style={{ position: 'absolute', bottom: 30, right: 90, fontSize: 18, opacity: 0.6 }}>✦</div>
      <div style={{ position: 'absolute', top: 360, right: 280, fontSize: 14, opacity: 0.5 }}>✧</div>

      {/* phone (scaled 0.7) */}
      <div style={{
        transform: 'scale(0.78)', transformOrigin: 'center center', position: 'relative',
        filter: 'drop-shadow(0 40px 60px rgba(124,58,237,0.18))',
      }}>
        {window.PhoneFrame && window.StateMinimized && (
          <window.PhoneFrame><window.StateMinimized/></window.PhoneFrame>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Feature cards
// ─────────────────────────────────────────────────────────────
function Features() {
  const items = [
    {
      icon: '📍',
      tag: 'MAP',
      tagColor: L.primary,
      title: '전국 뽑기방 지도',
      desc: '카카오맵 기반으로 내 위치 주변 뽑기방을 한 번에. GPS 한 번 켜면 가장 가까운 곳부터 정렬돼요.',
      accent: 'linear-gradient(135deg, #9B6CFF 0%, #7C3AED 100%)',
      stat: '전국 2,400+ 등록',
    },
    {
      icon: '💬',
      tag: 'REVIEW',
      tagColor: L.pink,
      title: '리얼 후기',
      desc: '성공·실패, 사용한 판 수, 지출 금액까지. 가기 전에 다른 사람들이 어떻게 뽑았는지 미리 확인하세요.',
      accent: 'linear-gradient(135deg, #FF9DC0 0%, #FF6B9D 100%)',
      stat: '18,000+ 인증 후기',
    },
    {
      icon: '🎬',
      tag: 'YOUTUBE',
      tagColor: L.red,
      title: '유튜브 연계',
      desc: '오뽑세 영상에 나왔던 그 뽑기방, 영상에서 바로 지도로. 채널 새 영상이 올라오면 핀이 자동으로 업데이트돼요.',
      accent: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
      stat: '채널 영상 → 지도 자동 연동',
    },
    {
      icon: '👥',
      tag: 'COMMUNITY',
      tagColor: L.yellow,
      title: '모임 & 이벤트',
      desc: '함께 뽑으러 가는 문화. 시즌별 챌린지, 인증샷 이벤트, 동네 친구 매칭까지 — 혼자보다 같이가 재밌어요.',
      accent: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
      stat: '매달 새로운 이벤트',
    },
  ];

  return (
    <section id="features" style={{
      padding: '96px 28px 96px',
      background: '#fff',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{
            display: 'inline-block', fontFamily: FF, fontSize: 13, fontWeight: 800,
            color: L.primary, letterSpacing: 2,
            padding: '6px 14px', borderRadius: 999, background: L.primarySoft,
          }}>FEATURES</span>
          <h2 style={{
            margin: '20px 0 14px', fontFamily: FF, fontSize: 44,
            fontWeight: 900, color: L.ink, letterSpacing: -1.3, lineHeight: 1.2,
          }}>뽑기방 찾을 때, 이거 하나면 끝</h2>
          <p style={{
            margin: 0, fontFamily: FF, fontSize: 17, color: L.text2,
            fontWeight: 500, letterSpacing: -0.2,
          }}>지도 · 후기 · 영상 · 커뮤니티가 한 곳에.</p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20,
        }}>
          {items.map((it, i) => (
            <div key={i} style={{
              position: 'relative', borderRadius: 26, padding: '32px 30px',
              background: L.bg,
              border: `1px solid ${L.line}`,
              overflow: 'hidden',
              minHeight: 260,
            }}>
              {/* accent corner */}
              <div style={{
                position: 'absolute', top: -40, right: -40,
                width: 160, height: 160, borderRadius: '50%',
                background: it.accent, opacity: 0.12,
              }}/>
              <div style={{
                position: 'absolute', top: -10, right: -10,
                width: 60, height: 60, borderRadius: '50%',
                background: it.accent, opacity: 0.2,
              }}/>

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: it.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                    boxShadow: '0 10px 24px rgba(31,17,68,0.16)',
                  }}>{it.icon}</div>
                  <span style={{
                    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                    fontSize: 10.5, fontWeight: 800, color: it.tagColor,
                    letterSpacing: 1.5, padding: '4px 10px', borderRadius: 6,
                    background: '#fff', border: `1px solid ${L.line}`,
                  }}>{it.tag}</span>
                </div>
                <h3 style={{
                  margin: '0 0 10px', fontFamily: FF, fontSize: 24,
                  fontWeight: 800, color: L.ink, letterSpacing: -0.6,
                }}>{it.title}</h3>
                <p style={{
                  margin: 0, fontFamily: FF, fontSize: 15, color: L.text2,
                  fontWeight: 500, lineHeight: 1.6, letterSpacing: -0.2,
                  textWrap: 'pretty', maxWidth: 460,
                }}>{it.desc}</p>
                <div style={{
                  marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontFamily: FF, fontSize: 12.5, fontWeight: 800, color: L.ink,
                  padding: '6px 11px', borderRadius: 8,
                  background: '#fff', border: `1px solid ${L.line}`,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5L4 7.5 9 2.5" stroke={it.tagColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {it.stat}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Preview gallery — real phone screens
// ─────────────────────────────────────────────────────────────
function PreviewGallery() {
  const screens = [
    { Comp: () => window.PhoneFrame && window.StateHalfSheet ? <window.PhoneFrame><window.StateHalfSheet/></window.PhoneFrame> : null,
      kicker: '01 · MAP', label: '지도 + 근처 뽑기방', sub: '거리순으로 정렬된 카드로 한 번에 비교' },
    { Comp: () => window.DetailPhone ? <window.DetailPhone scrollTop={0}/> : null,
      kicker: '02 · DETAIL', label: '스팟 상세 정보', sub: '사진 · 영업시간 · 별점 분포까지' },
    { Comp: () => window.DetailPhone ? <window.DetailPhone scrollTop={620}/> : null,
      kicker: '03 · REVIEW', label: '후기 모아보기', sub: '판 수 · 결과 태그가 달린 진짜 후기' },
    { Comp: () => window.FormPhone ? <window.FormPhone filled={true}/> : null,
      kicker: '04 · REGISTER', label: '직접 등록하기', sub: '새로 생긴 곳, 가장 먼저 공유' },
    { Comp: () => window.EventDetailPhone ? <window.EventDetailPhone/> : null,
      kicker: '05 · EVENT', label: '구독자 이벤트', sub: '챌린지 · 추첨 · 인증샷 대잔치' },
    { Comp: () => window.MyPagePhone ? <window.MyPagePhone scrollTop={0}/> : null,
      kicker: '06 · MY', label: '내 활동 한 곳에', sub: '내가 등록한 곳 · 찜 · 후기' },
  ];

  return (
    <section id="preview" style={{
      padding: '96px 28px 96px',
      background: `linear-gradient(180deg, ${L.bg} 0%, #EEEAF5 100%)`,
      overflow: 'hidden',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <span style={{
              display: 'inline-block', fontFamily: FF, fontSize: 13, fontWeight: 800,
              color: L.primary, letterSpacing: 2,
              padding: '6px 14px', borderRadius: 999, background: '#fff',
              border: `1px solid ${L.line}`,
            }}>SCREENS</span>
            <h2 style={{
              margin: '20px 0 12px', fontFamily: FF, fontSize: 42,
              fontWeight: 900, color: L.ink, letterSpacing: -1.2, lineHeight: 1.15,
            }}>직접 만나보세요</h2>
            <p style={{
              margin: 0, fontFamily: FF, fontSize: 16.5, color: L.text2,
              fontWeight: 500, letterSpacing: -0.2, maxWidth: 540,
            }}>실제 서비스의 6가지 화면. 슬라이드해서 모두 둘러보세요.</p>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontFamily: FF, fontSize: 12, fontWeight: 700, color: L.text3,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke={L.text3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            좌우로 스크롤
          </div>
        </div>
      </div>

      {/* horizontal scroller */}
      <div style={{
        overflowX: 'auto', overflowY: 'visible',
        padding: '20px 0 30px',
        scrollSnapType: 'x mandatory',
      }}>
        <div style={{
          display: 'inline-flex', gap: 28, padding: '0 max(28px, calc((100vw - 1240px) / 2))',
        }}>
          {screens.map((s, i) => (
            <div key={i} style={{
              flexShrink: 0, scrollSnapAlign: 'start',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18,
            }}>
              <div style={{
                fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
                fontSize: 11, fontWeight: 800, color: L.primary, letterSpacing: 1.5,
              }}>{s.kicker}</div>
              <div style={{
                width: 273, height: 591, // 390 * 0.7, 844 * 0.7
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  transform: 'scale(0.7)', transformOrigin: 'top left',
                  filter: 'drop-shadow(0 30px 60px rgba(31,17,68,0.18))',
                }}>
                  <s.Comp/>
                </div>
              </div>
              <div>
                <h4 style={{
                  margin: 0, fontFamily: FF, fontSize: 19, fontWeight: 800,
                  color: L.ink, letterSpacing: -0.4,
                }}>{s.label}</h4>
                <p style={{
                  margin: '5px 0 0', fontFamily: FF, fontSize: 13.5, color: L.text2,
                  fontWeight: 500, letterSpacing: -0.1,
                }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// YouTube channel CTA section
// ─────────────────────────────────────────────────────────────
function ChannelSection() {
  return (
    <section id="channel" style={{
      padding: '96px 28px',
      background: '#fff',
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56,
        alignItems: 'center',
      }}>
        <div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: FF, fontSize: 13, fontWeight: 800,
            color: L.red, letterSpacing: 1.5,
            padding: '6px 12px', borderRadius: 999, background: '#FEE2E2',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 5, background: L.red,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="#fff">
                <path d="M5 2 L5 10 L10 6 Z"/>
              </svg>
            </span>
            YOUTUBE
          </span>
          <h2 style={{
            margin: '18px 0 14px', fontFamily: FF, fontSize: 40,
            fontWeight: 900, color: L.ink, letterSpacing: -1.2, lineHeight: 1.2,
          }}>
            영상에서 보던 그 뽑기방,<br/>
            <span style={{ color: L.primary }}>지도에서 바로 찾기</span>
          </h2>
          <p style={{
            margin: '0 0 28px', fontFamily: FF, fontSize: 16, color: L.text2,
            fontWeight: 500, lineHeight: 1.65, letterSpacing: -0.2, maxWidth: 480,
            textWrap: 'pretty',
          }}>
            <b style={{ color: L.ink }}>오뽑세 채널 구독자</b>를 위한 공식 지도 서비스.
            영상에 등장한 매장은 자동으로 핀에 표시되고, 댓글의 "여기 어디예요?" 질문은 이제 사라집니다.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="#" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 52, padding: '0 22px', borderRadius: 14,
              background: L.red, color: '#fff',
              fontFamily: FF, fontSize: 14.5, fontWeight: 800, letterSpacing: -0.2,
              boxShadow: '0 10px 24px rgba(239,68,68,0.32)',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="#fff">
                <path d="M7 5l5 4-5 4z"/>
              </svg>
              유튜브 채널 보러가기
            </a>
            <a href={MAP_URL} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 52, padding: '0 20px', borderRadius: 14,
              background: '#fff', color: L.ink,
              border: `1.5px solid ${L.line}`,
              fontFamily: FF, fontSize: 14.5, fontWeight: 800, letterSpacing: -0.2,
            }}>
              지도 둘러보기
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M5 3l4 4-4 4" stroke={L.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        {/* mock video card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', top: -16, left: -16, right: 24, bottom: 24,
            background: 'linear-gradient(135deg, #FFE5EE 0%, #EDE7FF 100%)',
            borderRadius: 28, zIndex: 0,
          }}/>
          <div style={{
            position: 'relative', borderRadius: 22, overflow: 'hidden',
            background: '#000',
            boxShadow: '0 30px 60px rgba(31,17,68,0.18)',
          }}>
            {/* fake thumb */}
            <div style={{
              aspectRatio: '16/9',
              background: 'linear-gradient(135deg, #9B6CFF 0%, #FF6B9D 100%)',
              position: 'relative',
            }}>
              <svg width="100%" height="100%" viewBox="0 0 320 180" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <pattern id="ch-stripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(255,255,255,0.2)" strokeWidth="5"/>
                  </pattern>
                </defs>
                <rect width="320" height="180" fill="url(#ch-stripe)"/>
              </svg>
              {/* play */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 76, height: 76, borderRadius: '50%',
                background: 'rgba(255,255,255,0.95)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 14px 40px rgba(0,0,0,0.35)',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill={L.red}>
                  <path d="M10 6l13 8-13 8z"/>
                </svg>
              </div>
              {/* title overlay */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '50px 18px 16px',
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.75))',
              }}>
                <div style={{
                  fontFamily: FF, fontSize: 16, fontWeight: 800, color: '#fff',
                  letterSpacing: -0.3, textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                }}>강남역 500원 뽑기방 전부 털어봤습니다 🪙</div>
                <div style={{
                  marginTop: 4, display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: FF, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
                }}>
                  <span>오뽑세</span>
                  <span style={{ width: 3, height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.5)' }}/>
                  <span>조회수 142만 · 3일 전</span>
                </div>
              </div>
              {/* timestamp */}
              <div style={{
                position: 'absolute', bottom: 14, right: 14,
                background: 'rgba(0,0,0,0.75)', color: '#fff',
                fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 11, fontWeight: 700,
                padding: '3px 7px', borderRadius: 5,
              }}>12:43</div>
            </div>
          </div>
          {/* spot pin sticker */}
          <div style={{
            position: 'absolute', bottom: -30, right: -20,
            background: '#fff', borderRadius: 16,
            boxShadow: '0 14px 30px rgba(31,17,68,0.18)',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            transform: 'rotate(3deg)',
            zIndex: 5,
          }}>
            <svg width="36" height="42" viewBox="0 0 44 56">
              <path d="M22 2C11 2 2 10.5 2 21c0 9 7 16 18 31 1.4 1.9 2.6 1.9 4 0 11-15 18-22 18-31C42 10.5 33 2 22 2Z"
                    fill={L.primary} stroke="#fff" strokeWidth="2.5"/>
              <circle cx="22" cy="20" r="11" fill="#fff"/>
              <text x="22" y="24" textAnchor="middle" fontFamily={FF} fontSize="11" fontWeight="800" fill={L.primary}>3</text>
            </svg>
            <div>
              <div style={{ fontFamily: FF, fontSize: 11.5, fontWeight: 800, color: L.ink }}>
                영상 속 3개 매장
              </div>
              <div style={{ fontFamily: FF, fontSize: 10.5, fontWeight: 700, color: L.primary, marginTop: 1 }}>
                지도에서 바로 보기 →
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Final CTA
// ─────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '96px 28px 64px' }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        position: 'relative', overflow: 'hidden',
        borderRadius: 36, padding: '80px 64px',
        background: `radial-gradient(120% 120% at 20% 30%, #B98BFF 0%, ${L.primary} 50%, ${L.primaryDarker} 100%)`,
        boxShadow: '0 30px 70px rgba(124,58,237,0.4)',
      }}>
        {/* deco */}
        <svg width="320" height="320" viewBox="0 0 320 320" style={{ position: 'absolute', top: -80, right: -80, opacity: 0.18 }}>
          <circle cx="160" cy="160" r="160" fill="#fff"/>
        </svg>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: 'absolute', bottom: -60, left: -40, opacity: 0.12 }}>
          <circle cx="100" cy="100" r="100" fill="#fff"/>
        </svg>
        <div style={{ position: 'absolute', top: 60, right: 200, fontSize: 28, color: 'rgba(255,255,255,0.7)' }}>✨</div>
        <div style={{ position: 'absolute', bottom: 80, right: 120, fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>✦</div>
        <div style={{ position: 'absolute', top: 140, left: 60, fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>✧</div>

        <div style={{ position: 'relative', maxWidth: 720 }}>
          <span style={{
            display: 'inline-block', fontFamily: FF, fontSize: 12.5, fontWeight: 800,
            color: '#fff', letterSpacing: 2,
            padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
          }}>GET STARTED</span>
          <h2 style={{
            margin: '20px 0 16px', fontFamily: FF, fontSize: 56,
            fontWeight: 900, color: '#fff', letterSpacing: -1.8, lineHeight: 1.1,
          }}>
            이제 뽑으러<br/>갈 시간이에요 🐻
          </h2>
          <p style={{
            margin: '0 0 36px', fontFamily: FF, fontSize: 18, color: 'rgba(255,255,255,0.88)',
            fontWeight: 500, lineHeight: 1.55, letterSpacing: -0.2,
          }}>
            가입 없이 바로 둘러볼 수 있어요. 마음에 드는 뽑기방을 찾으면 그 때 로그인하세요.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href={MAP_URL} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 60, padding: '0 30px', borderRadius: 16,
              background: '#fff', color: L.primary,
              fontFamily: FF, fontSize: 16.5, fontWeight: 800, letterSpacing: -0.3,
              boxShadow: '0 14px 30px rgba(0,0,0,0.2)',
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 1.5c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 11 5.5 11s5.5-7 5.5-11c0-3-2.5-5.5-5.5-5.5Z" stroke={L.primary} strokeWidth="2" strokeLinejoin="round"/>
                <circle cx="10" cy="7" r="2.2" fill={L.primary}/>
              </svg>
              지금 바로 찾아보기
            </a>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0 20px', height: 60,
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              fontSize: 14, fontWeight: 700, color: '#fff',
              opacity: 0.85,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#fff" strokeWidth="1.4"/>
                <path d="M1.5 7h11M7 1.5c2 2 2 9 0 11M7 1.5c-2 2-2 9 0 11" stroke="#fff" strokeWidth="1.4"/>
              </svg>
              map.chanyeols.com
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${L.line}`, padding: '40px 28px 56px',
      background: '#fff',
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
        flexWrap: 'wrap',
      }}>
        <div>
          <Logo size={24}/>
          <p style={{
            margin: '12px 0 0', fontFamily: FF, fontSize: 12.5, color: L.text3,
            fontWeight: 500, letterSpacing: -0.1, maxWidth: 380,
          }}>
            인형뽑기 좋아하는 사람들을 위한 지도 · 후기 · 커뮤니티 서비스.
            <br/>유튜브 채널 <b style={{ color: L.text2 }}>오뽑세</b>가 만듭니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 32, fontFamily: FF }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: L.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>서비스</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href={MAP_URL} style={{ fontSize: 13, fontWeight: 600, color: L.ink }}>지도</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: L.ink }}>이벤트</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: L.ink }}>등록 가이드</a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: L.text3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>채널</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: L.ink }}>유튜브</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: L.ink }}>인스타그램</a>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: L.ink }}>문의하기</a>
            </div>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: 1240, margin: '32px auto 0', paddingTop: 20,
        borderTop: `1px solid ${L.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: FF, fontSize: 11.5, color: L.text3, fontWeight: 500,
      }}>
        <span>© 2026 오뽑세. All rights reserved.</span>
        <span>map.chanyeols.com</span>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
function LandingApp() {
  return (
    <div>
      <Nav/>
      <Hero/>
      <Features/>
      <PreviewGallery/>
      <ChannelSection/>
      <FinalCTA/>
      <Footer/>
    </div>
  );
}

const _root = document.getElementById('landing-root');
if (_root) ReactDOM.createRoot(_root).render(<LandingApp/>);
