// fab.jsx — the Floating Action Button + expanded vertical menu.

const MENU = [
  { key: 'view',     label: '반영일정 조회',     hint: '예정/검토/완료 일정 보기',     Icon: IconScheduleView    },
  { key: 'register', label: '반영일정 등록',     hint: '새 반영 일정을 큐에 추가',     Icon: IconScheduleAdd     },
  { key: 'date',     label: '날짜 조회',         hint: '특정 날짜의 반영 내역',         Icon: IconDate            },
  { key: 'cond',     label: '설정한 조건 조회', hint: '저장된 필터 프리셋 열기',         Icon: IconFilter          },
  { key: 'search',   label: '검색 설정',         hint: '기본 검색 컬럼·정렬 변경',      Icon: IconSearchSettings  },
  { key: 'help',     label: '사용법',            hint: '단축키, 워크플로 가이드',       Icon: IconHelp            },
];

// presets used by the animation tweak --------------------------------------
const ANIM_PRESETS = {
  slide: {
    // whole-stack slide-up
    container: (open) => ({
      transform: open ? 'translateY(0)' : 'translateY(8px)',
      opacity: open ? 1 : 0,
      transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), opacity 180ms ease',
    }),
    item: () => ({}),
  },
  stagger: {
    // each row fades + slides in one after another
    container: (open) => ({
      opacity: 1,
      transition: 'none',
    }),
    item: (i, total, open) => {
      const delay = open ? (total - 1 - i) * 28 : (total - 1 - i) * 14;
      return {
        transform: open ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
        opacity: open ? 1 : 0,
        transition: `transform 240ms cubic-bezier(.2,.8,.2,1) ${delay}ms, opacity 200ms ease ${delay}ms`,
      };
    },
  },
  scale: {
    // origin-bottom pop
    container: (open) => ({
      transform: open ? 'scale(1)' : 'scale(0.7)',
      transformOrigin: 'right bottom',
      opacity: open ? 1 : 0,
      transition: 'transform 240ms cubic-bezier(.3,1.4,.4,1), opacity 160ms ease',
    }),
    item: () => ({}),
  },
};

function useDrag(pos, setPos) {
  // remember last gesture so a click that follows a tiny jitter still toggles open
  const stateRef = React.useRef({ dragging: false, moved: false, sx:0, sy:0, ox:0, oy:0 });

  const onPointerDown = (e) => {
    // only left button
    if (e.button !== 0) return;
    stateRef.current = {
      dragging: true,
      moved: false,
      sx: e.clientX, sy: e.clientY,
      ox: pos.x, oy: pos.y,
    };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.sx;
    const dy = e.clientY - s.sy;
    if (!s.moved && Math.hypot(dx, dy) > 4) s.moved = true;
    if (s.moved) {
      // pos.x/y are distance from right/bottom edges
      const vw = window.innerWidth, vh = window.innerHeight;
      const nx = Math.max(12, Math.min(vw - 80, s.ox - dx));
      const ny = Math.max(12, Math.min(vh - 80, s.oy - dy));
      setPos({ x: nx, y: ny });
    }
  };
  const endDrag = () => { stateRef.current.dragging = false; };
  const wasMoved = () => stateRef.current.moved;
  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, wasMoved };
}

const FAB = ({ theme, size, animKey, open, setOpen, activePanel, setActivePanel, pos, setPos }) => {
  const drag = useDrag(pos, setPos);
  const preset = ANIM_PRESETS[animKey] || ANIM_PRESETS.slide;

  const handleFabClick = () => {
    if (drag.wasMoved()) return; // suppress click after drag
    setOpen(!open);
  };

  // dimensions derived from FAB size
  const itemHeight = Math.max(40, Math.round(size * 0.78));
  const labelFont = size >= 60 ? 13.5 : size >= 52 ? 13 : 12.5;
  const fabIcon = Math.round(size * 0.42);

  return (
    <div style={{
      position: 'fixed',
      right: pos.x,
      bottom: pos.y,
      zIndex: 2147483600, // chrome extension-style high z
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 10,
      pointerEvents: 'auto',
    }}>
      {/* menu stack */}
      <div
        aria-hidden={!open}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          pointerEvents: open ? 'auto' : 'none',
          ...preset.container(open),
        }}
      >
        {MENU.map((m, i) => {
          const itemStyle = preset.item(i, MENU.length, open);
          const isActive = activePanel === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setActivePanel(isActive ? null : m.key);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: itemHeight,
                padding: '0 14px 0 12px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid '+theme.line,
                borderRadius: itemHeight / 2,
                boxShadow: '0 8px 24px -8px rgba(15,23,42,0.18), 0 1px 2px rgba(15,23,42,0.06)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: labelFont,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                whiteSpace: 'nowrap',
                ...itemStyle,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.tint; e.currentTarget.style.borderColor = theme.borderHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = theme.line; }}
            >
              <span style={{
                width: Math.round(itemHeight * 0.62), height: Math.round(itemHeight * 0.62),
                borderRadius: 8,
                background: theme.tint,
                color: theme.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <m.Icon size={Math.round(itemHeight * 0.36)} strokeWidth={1.7} />
              </span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* the FAB itself */}
      <button
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={(e) => { drag.onPointerUp(e); }}
        onPointerCancel={drag.onPointerCancel}
        onClick={handleFabClick}
        aria-label="unisupport tools"
        aria-expanded={open}
        title={open ? '닫기' : 'unisupport · 메뉴 열기'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: 'none',
          background: `linear-gradient(180deg, ${theme.primaryLight} 0%, ${theme.primary} 55%, ${theme.primaryDark} 100%)`,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          touchAction: 'none',
          boxShadow: `
            0 18px 36px -10px ${theme.primaryShadow},
            0 6px 14px -4px rgba(15,23,42,0.18),
            inset 0 1px 0 rgba(255,255,255,0.25),
            inset 0 -1px 0 rgba(15,23,42,0.12)
          `,
          transition: 'transform 220ms cubic-bezier(.2,.8,.2,1), box-shadow 200ms ease',
          transform: open ? 'rotate(45deg)' : 'rotate(0)',
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = open ? 'rotate(45deg) scale(1.04)' : 'scale(1.04)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = open ? 'rotate(45deg)' : 'rotate(0)'}
      >
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <IconPlus size={fabIcon} strokeWidth={2} />
        </span>
        {/* drag handle ring — appears on hover */}
        <span aria-hidden style={{
          position: 'absolute',
          inset: -1,
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
      </button>

      {/* tiny "us" wordmark badge at bottom-right of FAB */}
      <span aria-hidden style={{
        position: 'absolute',
        right: -2, bottom: -2,
        width: Math.round(size * 0.32),
        height: Math.round(size * 0.32),
        borderRadius: '50%',
        background: '#fff',
        color: theme.primaryDark,
        fontSize: Math.round(size * 0.16),
        fontWeight: 700,
        letterSpacing: '-0.04em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(15,23,42,0.18), inset 0 0 0 1px '+theme.line,
        fontFamily: 'inherit',
        pointerEvents: 'none',
      }}>us</span>
    </div>
  );
};

Object.assign(window, { FAB, MENU });
