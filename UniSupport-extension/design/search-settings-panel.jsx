// search-settings-panel.jsx
// "검색 설정" — handler / start-date / team / status / sort / auto-apply.
//
// Selection rules:
//   - 처리자       : text input
//   - 시작일       : single-select chips (radio behaviour)
//   - 팀           : multi-select chips
//   - 처리상태     : multi-select chips
//   - 정렬 기준    : TWO single-select rows (sort field, sort direction)
//   - 자동 설정    : toggle

const SS_DATE_TYPE_OPTIONS = ['접수일', '처리일'];
const SS_DATE_OPTIONS   = ['10일 전', '한달', '3개월', '6개월', '360일'];
const SS_TEAM_OPTIONS   = ['전체', '1팀', '2팀', '3팀', '4팀', '5팀', '6팀', '7팀', '미지정'];
const SS_STATUS_OPTIONS = ['확인요청', '테스트요청', '운영반영요청', '접수', '보류', '처리중', '검토', '고객사답변'];
const SS_SORT_FIELD     = ['사용 안함', '처리상태', '고객사명', '처리일'];
const SS_SORT_DIR       = ['오름차순', '내림차순'];

function SearchSettingsPanel({ theme, onClose }) {
  const [handler, setHandler]   = React.useState('오찬열');
  const [dateType, setDateType] = React.useState('접수일');
  const [date, setDate]         = React.useState('360일');
  const [teams, setTeams]       = React.useState(['2팀', '4팀', '6팀', '미지정']);
  const [statuses, setStatuses] = React.useState(['확인요청', '테스트요청', '운영반영요청', '처리중', '검토', '고객사답변']);
  const [sortField, setSortField] = React.useState('처리일');
  const [sortDir, setSortDir]   = React.useState('내림차순');
  const [autoApply, setAutoApply] = React.useState(false);

  const toggleIn = (arr, setArr) => (v) => {
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  return (
    <Panel title="검색 설정" subtitle="저장된 프리셋이 다음 진입 시 기본으로 적용돼요" theme={theme} onClose={onClose} width={400}>
      <SSSection label="처리자">
        <div style={ssStyles.inputRow}>
          <span style={{
            width: 24, height: 24, borderRadius: '50%',
            background: theme.tint, color: theme.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
            border: '1px solid '+theme.line,
          }}>{handler.slice(0, 1) || '·'}</span>
          <input
            value={handler}
            onChange={(e) => setHandler(e.target.value)}
            placeholder="이름으로 검색"
            style={ssStyles.input}
          />
        </div>
      </SSSection>

      <SSSection label="날짜 기준" hint="단일 선택">
        <SSSegmented options={SS_DATE_TYPE_OPTIONS} value={dateType} onChange={setDateType} theme={theme} />
      </SSSection>

      <SSSection label="시작일" hint="단일 선택">
        <SSChipGroup mode="single" options={SS_DATE_OPTIONS} value={date} onChange={setDate} theme={theme} />
      </SSSection>

      <SSSection label="팀" hint={`다중 · ${teams.length}개`}>
        <SSChipGroup mode="multi" options={SS_TEAM_OPTIONS} value={teams} onChange={toggleIn(teams, setTeams)} theme={theme} />
      </SSSection>

      <SSSection label="처리상태" hint={`다중 · ${statuses.length}개`}>
        <SSChipGroup mode="multi" options={SS_STATUS_OPTIONS} value={statuses} onChange={toggleIn(statuses, setStatuses)} theme={theme} />
      </SSSection>

      <SSSection label="정렬 기준" hint={sortField === '사용 안함' ? '정렬 없음' : '각 행 단일 선택'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SSSegmented options={SS_SORT_FIELD} value={sortField} onChange={setSortField} theme={theme} />
          {/* '사용 안함' 선택 시 방향 선택 숨김 */}
          {sortField !== '사용 안함' && (
            <SSSegmented options={SS_SORT_DIR} value={sortDir} onChange={setSortDir} theme={theme} />
          )}
        </div>
      </SSSection>

      <div style={ssStyles.autoRow}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>화면 진입 시 자동 설정</span>
          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>다음 접속 때 이 조건이 즉시 적용돼요</span>
        </div>
        <SSToggle value={autoApply} onChange={setAutoApply} theme={theme} />
      </div>

      <div style={ssStyles.footer}>
        <button style={ssStyles.btnGhost} onClick={onClose}>닫기</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={ssStyles.btnGhost}>저장</button>
          <button style={{ ...ssStyles.btnPrimary, background: theme.primary }}>저장 & 조회</button>
        </div>
      </div>
    </Panel>
  );
}

// ── building blocks ─────────────────────────────────────────────────────────

const SSSection = ({ label, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', letterSpacing: '-0.005em' }}>{label}</span>
      {hint && <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 500, letterSpacing: '0.02em' }}>{hint}</span>}
    </div>
    {children}
  </div>
);

function SSChipGroup({ mode, options, value, onChange, theme }) {
  // mode = 'single' | 'multi'
  const isSelected = (o) => mode === 'single' ? value === o : value.includes(o);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const sel = isSelected(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              appearance: 'none',
              border: '1px solid ' + (sel ? theme.primary : theme.line),
              background: sel ? theme.primary : '#fff',
              color: sel ? '#fff' : '#334155',
              padding: '5px 11px 5px ' + (mode === 'single' && sel ? '8px' : '11px'),
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: sel ? 600 : 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '-0.005em',
              transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: sel ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
            }}
            onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = theme.borderHover; e.currentTarget.style.background = theme.tint; } }}
            onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = theme.line; e.currentTarget.style.background = '#fff'; } }}
          >
            {mode === 'single' && sel && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#fff',
                boxShadow: '0 0 0 1.5px rgba(255,255,255,0.5)', display: 'inline-block',
              }} />
            )}
            {o}
          </button>
        );
      })}
    </div>
  );
}

// segmented control — clear "two-row" sort UX
function SSSegmented({ options, value, onChange, theme }) {
  const idx = Math.max(0, options.indexOf(value));
  return (
    <div style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      padding: 3,
      background: '#f1f5f9',
      borderRadius: 10,
      gap: 0,
    }}>
      {/* moving thumb */}
      <div style={{
        position: 'absolute',
        top: 3, bottom: 3,
        left: `calc(3px + ${idx} * ((100% - 6px) / ${options.length}))`,
        width: `calc((100% - 6px) / ${options.length})`,
        background: '#fff',
        borderRadius: 7,
        boxShadow: '0 1px 2px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)',
        transition: 'left 220ms cubic-bezier(.2,.8,.2,1)',
      }} />
      {options.map((o) => {
        const sel = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              position: 'relative',
              zIndex: 1,
              appearance: 'none',
              border: 'none',
              background: 'transparent',
              padding: '7px 10px',
              fontSize: 12.5,
              fontWeight: sel ? 600 : 500,
              color: sel ? theme.primary : '#64748b',
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderRadius: 7,
              transition: 'color 160ms ease',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function SSToggle({ value, onChange, theme }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        appearance: 'none',
        border: 'none',
        width: 38, height: 22,
        borderRadius: 999,
        background: value ? theme.primary : '#cbd5e1',
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background 200ms ease',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2, left: value ? 18 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(15,23,42,0.25)',
        transition: 'left 200ms cubic-bezier(.2,.8,.2,1)',
      }} />
    </button>
  );
}

const ssStyles = {
  inputRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    background: '#fff',
  },
  input: {
    flex: 1, border: 'none', outline: 'none',
    fontSize: 13.5, color: '#0f172a',
    fontFamily: 'inherit', background: 'transparent',
    minWidth: 0,
  },
  autoRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 12px',
    background: '#f8fafc',
    borderRadius: 10,
    border: '1px solid #f1f5f9',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 4,
  },
  btnGhost: {
    appearance: 'none', border: '1px solid #e2e8f0', background: '#fff',
    padding: '8px 14px', borderRadius: 9, fontSize: 13, color: '#334155',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  btnPrimary: {
    appearance: 'none', border: 'none', color: '#fff',
    padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.005em',
    boxShadow: '0 1px 2px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
};

Object.assign(window, { SearchSettingsPanel });
