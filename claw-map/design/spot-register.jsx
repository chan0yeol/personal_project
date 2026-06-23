/* global React */
// Spot registration form — 클로맵
// Full-screen page (not bottom sheet). 390x844.

const SR_C = {
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
  green: '#10B981',
  greenSoft: '#DCFCE7',
  red: '#EF4444',
  redSoft: '#FEE2E2',
  amber: '#F59E0B',
  amberSoft: '#FEF3C7',
};
const SR_FONT = `'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;

// ─────────────────────────────────────────────────────────────
// Section card wrapper
// ─────────────────────────────────────────────────────────────
function SectionCard({ title, hint, children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '18px 18px 20px',
      boxShadow: '0 1px 0 rgba(31,17,68,0.04)',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{
          margin: 0, fontFamily: SR_FONT, fontSize: 15, fontWeight: 800,
          color: SR_C.text, letterSpacing: -0.3,
        }}>{title}</h3>
        {hint && <span style={{ fontFamily: SR_FONT, fontSize: 11, fontWeight: 600, color: SR_C.text3 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Field (label + input)
// ─────────────────────────────────────────────────────────────
function Field({ label, required, children, helper }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, marginBottom: 7,
      }}>
        <label style={{
          fontFamily: SR_FONT, fontSize: 12.5, fontWeight: 700,
          color: SR_C.text2, letterSpacing: -0.1,
        }}>
          {label}
        </label>
        {required && <span style={{ color: SR_C.primary, fontSize: 13, lineHeight: 1, fontWeight: 800 }}>*</span>}
      </div>
      {children}
      {helper && <div style={{
        marginTop: 6, fontFamily: SR_FONT, fontSize: 11.5, color: SR_C.text3, fontWeight: 500,
      }}>{helper}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Text input (with optional right-side button)
// ─────────────────────────────────────────────────────────────
function TextInput({ value, placeholder, leftIcon, rightSlot, focused, counter }) {
  return (
    <div style={{
      height: 52, display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 14px',
      background: focused ? '#fff' : SR_C.bg,
      border: `1.5px solid ${focused ? SR_C.primary : 'transparent'}`,
      borderRadius: 14,
      transition: 'border-color .15s, background .15s',
    }}>
      {leftIcon}
      <div style={{
        flex: 1, fontFamily: SR_FONT, fontSize: 15,
        color: value ? SR_C.text : SR_C.text3,
        fontWeight: value ? 700 : 500,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        letterSpacing: -0.2,
      }}>
        {value || placeholder}
        {focused && (
          <span style={{
            display: 'inline-block', width: 1.5, height: 18, marginLeft: 1,
            background: SR_C.primary, verticalAlign: -3,
            animation: 'sr-blink 1s infinite',
          }}/>
        )}
      </div>
      {counter && (
        <span style={{ fontFamily: SR_FONT, fontSize: 11, fontWeight: 600, color: SR_C.text3 }}>{counter}</span>
      )}
      {rightSlot}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Photo uploader strip
// ─────────────────────────────────────────────────────────────
function PhotoUploader({ photos = [], max = 5 }) {
  return (
    <div>
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
      }}>
        {/* add tile */}
        <div style={{
          width: 92, height: 92, borderRadius: 14, flexShrink: 0,
          border: `2px dashed ${SR_C.primary}`,
          background: SR_C.primaryFaint,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="2" y="6" width="18" height="14" rx="2.5" stroke={SR_C.primary} strokeWidth="1.8"/>
            <path d="M7 6L8.3 4h5.4L15 6" stroke={SR_C.primary} strokeWidth="1.8" strokeLinejoin="round"/>
            <circle cx="11" cy="13" r="3.5" stroke={SR_C.primary} strokeWidth="1.8"/>
          </svg>
          <div style={{
            fontFamily: SR_FONT, fontSize: 11, fontWeight: 800, color: SR_C.primary,
          }}>
            <span style={{ color: SR_C.primaryDark }}>{photos.length}</span>
            <span style={{ color: SR_C.text3 }}> / {max}</span>
          </div>
        </div>
        {/* thumbnails */}
        {photos.map((p, i) => (
          <div key={i} style={{
            position: 'relative', width: 92, height: 92, borderRadius: 14, flexShrink: 0,
            background: p, overflow: 'hidden',
          }}>
            <svg width="100%" height="100%" viewBox="0 0 92 92" preserveAspectRatio="none">
              <defs>
                <pattern id={`up-st-${i}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.4)" strokeWidth="3.5"/>
                </pattern>
              </defs>
              <rect width="92" height="92" fill={`url(#up-st-${i})`}/>
            </svg>
            {i === 0 && (
              <div style={{
                position: 'absolute', bottom: 6, left: 6,
                background: 'rgba(26,22,38,0.7)', color: '#fff',
                fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 5,
                fontFamily: SR_FONT,
              }}>대표</div>
            )}
            <div style={{
              position: 'absolute', top: 5, right: 5,
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(26,22,38,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="9" height="9" viewBox="0 0 9 9">
                <path d="M2 2l5 5M7 2l-5 5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 10, padding: '8px 12px', borderRadius: 10,
        background: SR_C.primaryFaint,
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: SR_FONT, fontSize: 11.5, color: SR_C.primaryDark, fontWeight: 600,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke={SR_C.primary} strokeWidth="1.4"/>
          <path d="M7 4v3.5M7 9.5v.5" stroke={SR_C.primary} strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        매장 외관 1장은 꼭 등록해주세요!
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toggle switch row
// ─────────────────────────────────────────────────────────────
function ToggleRow({ icon, label, sub, on, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 0',
      borderBottom: isLast ? 'none' : `1px solid ${SR_C.line}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: on ? SR_C.primarySoft : SR_C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
        transition: 'background .15s',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SR_FONT, fontSize: 14.5, fontWeight: 800, color: SR_C.text, letterSpacing: -0.2 }}>
          {label}
        </div>
        {sub && (
          <div style={{ marginTop: 2, fontFamily: SR_FONT, fontSize: 11.5, color: SR_C.text3, fontWeight: 500 }}>
            {sub}
          </div>
        )}
      </div>
      {/* switch */}
      <div style={{
        width: 50, height: 30, borderRadius: 999, position: 'relative',
        background: on ? SR_C.primary : '#D9D4E5',
        boxShadow: on ? '0 2px 6px rgba(124,58,237,0.32)' : 'inset 0 1px 2px rgba(0,0,0,0.06)',
        transition: 'background .2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: on ? 23 : 3,
          width: 24, height: 24, borderRadius: '50%', background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
          transition: 'left .2s',
        }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Difficulty segmented control
// ─────────────────────────────────────────────────────────────
function DifficultySegment({ value = 'normal' }) {
  const opts = [
    { id: 'easy',   label: '쉬움',   emoji: '😊', bg: SR_C.greenSoft, fg: SR_C.green,   ring: '#86EFAC' },
    { id: 'normal', label: '보통',   emoji: '😐', bg: SR_C.amberSoft, fg: SR_C.amber,   ring: '#FCD34D' },
    { id: 'hard',   label: '어려움', emoji: '😤', bg: SR_C.redSoft,   fg: SR_C.red,     ring: '#FCA5A5' },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
    }}>
      {opts.map(o => {
        const a = o.id === value;
        return (
          <div key={o.id} style={{
            height: 76, borderRadius: 14, padding: 10,
            background: a ? o.bg : '#fff',
            border: `1.5px solid ${a ? o.ring : SR_C.line}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            position: 'relative',
            transition: 'background .15s, border-color .15s',
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{o.emoji}</span>
            <span style={{
              fontFamily: SR_FONT, fontSize: 13, fontWeight: 800,
              color: a ? o.fg : SR_C.text2, letterSpacing: -0.2,
            }}>{o.label}</span>
            {a && (
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16, borderRadius: '50%', background: o.fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5L3.5 6.5 7.5 2.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Top app bar
// ─────────────────────────────────────────────────────────────
function FormTopBar() {
  return (
    <div style={{
      position: 'absolute', top: 54, left: 0, right: 0, zIndex: 50,
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 8px', background: '#fff',
      borderBottom: `1px solid ${SR_C.line}`,
    }}>
      <button style={{
        width: 44, height: 44, borderRadius: 12, background: 'transparent',
        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4L6 10l6 6" stroke={SR_C.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{ flex: 1, textAlign: 'center', fontFamily: SR_FONT, fontSize: 16, fontWeight: 800, color: SR_C.text, letterSpacing: -0.3 }}>
        뽑기방 등록
      </div>
      {/* draft save */}
      <button style={{
        height: 36, padding: '0 12px', borderRadius: 999,
        background: SR_C.bg, border: 'none', marginRight: 6,
        fontFamily: SR_FONT, fontSize: 12.5, fontWeight: 700, color: SR_C.text2,
      }}>
        임시저장
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom CTA (sticky)
// ─────────────────────────────────────────────────────────────
function FormBottomCTA({ disabled = false }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50,
      background: '#fff',
      borderTop: `1px solid ${SR_C.line}`,
      padding: '12px 16px 30px',
    }}>
      <div style={{
        height: 56, borderRadius: 16,
        background: disabled ? '#E5E0EE' : `linear-gradient(135deg,#9B6CFF,${SR_C.primary})`,
        boxShadow: disabled ? 'none' : '0 8px 22px rgba(124,58,237,0.36)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        color: disabled ? SR_C.text3 : '#fff',
        fontFamily: SR_FONT, fontSize: 16, fontWeight: 800, letterSpacing: -0.3,
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2.5 9l4.5 4.5L15.5 4" stroke={disabled ? SR_C.text3 : '#fff'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        등록하기
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main form doc
// ─────────────────────────────────────────────────────────────
function RegisterForm({ filled = false }) {
  const photos = filled
    ? ['linear-gradient(135deg,#9B6CFF,#7C3AED)',
       'linear-gradient(135deg,#FF9DC0,#FF6B9D)',
       'linear-gradient(135deg,#FBBF24,#F59E0B)']
    : [];

  const f = (filled, val, ph) => filled ? val : '';

  return (
    <div style={{ background: SR_C.bg, padding: '14px 14px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* progress */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: SR_C.primarySoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
        }}>📝</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: SR_FONT, fontSize: 13.5, fontWeight: 800, color: SR_C.text, letterSpacing: -0.2 }}>
            새로운 뽑기방 알려주세요
          </div>
          <div style={{ marginTop: 5, height: 5, borderRadius: 999, background: SR_C.bg, overflow: 'hidden' }}>
            <div style={{ width: filled ? '70%' : '15%', height: '100%', background: SR_C.primary, borderRadius: 999 }}/>
          </div>
        </div>
        <div style={{ fontFamily: SR_FONT, fontSize: 12, fontWeight: 800, color: SR_C.primary }}>
          {filled ? '70%' : '15%'}
        </div>
      </div>

      {/* photos */}
      <SectionCard title="사진 추가" hint="최대 5장">
        <PhotoUploader photos={photos} max={5}/>
      </SectionCard>

      {/* basic info */}
      <SectionCard title="기본 정보">
        <Field label="상호명" required>
          <TextInput
            value={f(filled, '인생네컷 강남역점')}
            placeholder="가게 이름을 입력해주세요"
            focused={!filled}
            counter={filled ? '11 / 30' : undefined}
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 7l6-4 6 4v8H3V7Z" stroke={SR_C.text3} strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M7 15v-4h4v4" stroke={SR_C.text3} strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            }
          />
        </Field>
        <Field label="주소" required helper="지도에서 위치를 선택하면 자동으로 입력돼요">
          <TextInput
            value={f(filled, '서울 강남구 강남대로 123, 지하 1층')}
            placeholder="주소를 입력해주세요"
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5c-3 0-5.5 2.5-5.5 5.5 0 4 5.5 9.5 5.5 9.5s5.5-5.5 5.5-9.5c0-3-2.5-5.5-5.5-5.5Z"
                      stroke={SR_C.text3} strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="2" stroke={SR_C.text3} strokeWidth="1.6"/>
              </svg>
            }
            rightSlot={
              <div style={{
                height: 36, padding: '0 12px', borderRadius: 10,
                background: SR_C.primary, color: '#fff',
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: SR_FONT, fontSize: 12, fontWeight: 800,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="#fff" strokeWidth="1.5"/>
                  <circle cx="6" cy="6" r="1.5" fill="#fff"/>
                </svg>
                지도에서
              </div>
            }
          />
        </Field>
        <Field label="영업시간">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
            <TextInput
              value={f(filled, '10:00')}
              placeholder="오픈"
              leftIcon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={SR_C.text3} strokeWidth="1.6"/><path d="M8 4.5V8l2 1.5" stroke={SR_C.text3} strokeWidth="1.6" strokeLinecap="round"/></svg>}
            />
            <span style={{ fontFamily: SR_FONT, fontSize: 14, fontWeight: 700, color: SR_C.text3 }}>~</span>
            <TextInput
              value={f(filled, '24:00')}
              placeholder="마감"
            />
          </div>
          <div style={{
            display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap',
          }}>
            {[
              { label: '24시간 운영', active: filled },
              { label: '매일 같음', active: false },
              { label: '요일별 다름', active: false },
            ].map(c => (
              <div key={c.label} style={{
                height: 30, padding: '0 11px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: c.active ? SR_C.primary : '#fff',
                color: c.active ? '#fff' : SR_C.text2,
                border: c.active ? 'none' : `1px solid ${SR_C.line}`,
                fontFamily: SR_FONT, fontSize: 11.5, fontWeight: 700,
              }}>
                {c.active && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5L3.5 6.5 7.5 2.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {c.label}
              </div>
            ))}
          </div>
        </Field>
      </SectionCard>

      {/* machine info */}
      <SectionCard title="기계 정보">
        <ToggleRow icon="🪙" label="500원 기계" sub="동전·지폐 기준" on={true}/>
        <ToggleRow icon="💴" label="1000원 기계" sub="고급 기계 / 큰 인형" on={true}/>
        <ToggleRow icon="🅿️" label="주차 가능" sub="매장 또는 인근 주차장" on={false} isLast/>
        <div style={{ height: 1, background: SR_C.line, margin: '8px 0 18px' }}/>
        <Field label="난이도" required helper="평균적인 체감 난이도를 선택해주세요">
          <DifficultySegment value="normal"/>
        </Field>
      </SectionCard>

      {/* notes (optional) */}
      <SectionCard title="추가 정보" hint="선택">
        <Field label="한 줄 소개">
          <div style={{
            minHeight: 96, padding: '14px',
            background: SR_C.bg, borderRadius: 14,
            fontFamily: SR_FONT, fontSize: 14, color: SR_C.text3, fontWeight: 500,
            lineHeight: 1.55, letterSpacing: -0.2,
          }}>
            {filled
              ? <span style={{ color: SR_C.text, fontWeight: 600 }}>대형 인형 종류가 많고 신상이 빨리 들어와요. 500원 기계가 부담 없어서 친구랑 들리기 좋아요!</span>
              : '이 매장만의 특별한 점을 알려주세요 (선택)'}
            <div style={{
              marginTop: 8, fontFamily: SR_FONT, fontSize: 11, color: SR_C.text3, textAlign: 'right', fontWeight: 600,
            }}>{filled ? '52' : '0'} / 200</div>
          </div>
        </Field>
      </SectionCard>

      {/* notice */}
      <div style={{
        padding: '12px 14px', borderRadius: 14,
        background: SR_C.primaryFaint,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="9" cy="9" r="7.5" stroke={SR_C.primary} strokeWidth="1.5"/>
          <path d="M9 5v4.5M9 12.5v.5" stroke={SR_C.primary} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        <div style={{ fontFamily: SR_FONT, fontSize: 12, color: SR_C.primaryDark, fontWeight: 600, lineHeight: 1.55 }}>
          허위 정보 등록 시 계정이 제한될 수 있어요.
          <br/>등록된 정보는 검토 후 24시간 내 노출됩니다.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Phone frame for the form
// ─────────────────────────────────────────────────────────────
function FormPhone({ filled = false }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 48, overflow: 'hidden',
      position: 'relative', background: '#fff',
      boxShadow: '0 30px 80px rgba(31,17,68,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
      fontFamily: SR_FONT,
    }}>
      <style>{`@keyframes sr-blink { 50% { opacity: 0; } }`}</style>
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
        <div style={{ fontFamily: SR_FONT, fontSize: 15, fontWeight: 800, color: SR_C.text }}>9:41</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><path d="M0 8h2v3H0zM4 6h2v5H4zM8 4h2v7H8zM12 1h2v10h-2z" fill={SR_C.text}/></svg>
          <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5a8 8 0 0 1 12 0M3 7a5 5 0 0 1 8 0" stroke={SR_C.text} strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="9.5" r="1.2" fill={SR_C.text}/></svg>
          <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke={SR_C.text} fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill={SR_C.text}/><rect x="19.5" y="3" width="1.5" height="4" rx="0.5" fill={SR_C.text}/></svg>
        </div>
      </div>

      {/* top bar */}
      <FormTopBar/>

      {/* scroll viewport */}
      <div style={{
        position: 'absolute', top: 110, left: 0, right: 0, bottom: 102,
        overflow: 'hidden', background: SR_C.bg,
      }}>
        <div style={{ position: 'absolute', top: filled ? -480 : 0, left: 0, right: 0 }}>
          <RegisterForm filled={filled}/>
        </div>
      </div>

      {/* CTA */}
      <FormBottomCTA disabled={!filled}/>

      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.35)', zIndex: 100,
      }}/>
    </div>
  );
}

window.FormPhone = FormPhone;
