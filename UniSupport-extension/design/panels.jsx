// panels.jsx — mocks for "반영일정 조회" (list) and "반영일정 등록" (form).

const SchedulePanel = ({ theme, onClose }) => {
  const rows = [
    { id: 'REL-2418', title: '결제 모듈 v2.3 핫픽스', team: 'Payments', when: '06-02 02:00', risk: 'high', status: 'scheduled' },
    { id: 'REL-2417', title: '검색 추천 알고리즘 개선', team: 'Search',   when: '06-01 23:30', risk: 'med',  status: 'scheduled' },
    { id: 'REL-2415', title: '회원 약관 페이지 문구 수정', team: 'CX',     when: '05-30 10:00', risk: 'low',  status: 'review' },
    { id: 'REL-2414', title: '관리자 대시보드 권한 분리', team: 'Admin',   when: '05-29 18:00', risk: 'med',  status: 'done' },
    { id: 'REL-2412', title: '백오피스 리포트 CSV 내보내기', team: 'BO',   when: '05-28 14:00', risk: 'low',  status: 'done' },
  ];
  const riskTone = {
    high: { bg: 'rgba(220,38,38,0.10)', fg: '#b91c1c' },
    med:  { bg: 'rgba(234,179,8,0.14)', fg: '#a16207' },
    low:  { bg: 'rgba(16,185,129,0.12)', fg: '#047857' },
  };
  const statusTone = {
    scheduled: { dot: theme.primary, label: '예정' },
    review:    { dot: '#a16207', label: '검토중' },
    done:      { dot: '#94a3b8', label: '완료' },
  };
  return (
    <Panel title="반영일정 조회" subtitle="이번 주 · 5건" theme={theme} onClose={onClose} width={520}>
      <div style={panelStyles.toolbar}>
        <div style={panelStyles.chips}>
          <span style={{...panelStyles.chip, ...panelStyles.chipOn(theme)}}>전체 12</span>
          <span style={panelStyles.chip}>오늘 2</span>
          <span style={panelStyles.chip}>이번 주 5</span>
          <span style={panelStyles.chip}>다음 주 5</span>
        </div>
        <div style={panelStyles.searchWrap}>
          <input style={panelStyles.search} placeholder="제목 · 담당 · 티켓번호 검색" />
        </div>
      </div>
      <div style={panelStyles.table}>
        <div style={panelStyles.thead}>
          <div style={{flex:'0 0 76px'}}>ID</div>
          <div style={{flex:'1 1 auto'}}>제목</div>
          <div style={{flex:'0 0 80px'}}>팀</div>
          <div style={{flex:'0 0 92px'}}>일정</div>
          <div style={{flex:'0 0 56px'}}>위험</div>
          <div style={{flex:'0 0 68px'}}>상태</div>
        </div>
        {rows.map((r, i) => (
          <div key={r.id} style={{...panelStyles.tr, borderBottom: i === rows.length-1 ? 'none' : '1px solid #f1f5f9'}}>
            <div style={{flex:'0 0 76px', fontFamily:'ui-monospace, SF Mono, Menlo, monospace', fontSize:12, color:'#475569'}}>{r.id}</div>
            <div style={{flex:'1 1 auto', fontWeight:500}}>{r.title}</div>
            <div style={{flex:'0 0 80px', color:'#64748b'}}>{r.team}</div>
            <div style={{flex:'0 0 92px', color:'#334155', fontFamily:'ui-monospace, SF Mono, Menlo, monospace', fontSize:12}}>{r.when}</div>
            <div style={{flex:'0 0 56px'}}>
              <span style={{...panelStyles.tag, background: riskTone[r.risk].bg, color: riskTone[r.risk].fg}}>
                {r.risk.toUpperCase()}
              </span>
            </div>
            <div style={{flex:'0 0 68px', display:'flex', alignItems:'center', gap:6, color:'#334155'}}>
              <span style={{width:6, height:6, borderRadius:'50%', background: statusTone[r.status].dot}} />
              {statusTone[r.status].label}
            </div>
          </div>
        ))}
      </div>
      <div style={panelStyles.footer}>
        <span style={{color:'#94a3b8'}}>UTC+09 · 마지막 동기화 2분 전</span>
        <button style={panelStyles.btnGhost}>CSV 내보내기</button>
      </div>
    </Panel>
  );
};

const RegisterPanel = ({ theme, onClose }) => {
  const [risk, setRisk] = React.useState('med');
  const [team, setTeam] = React.useState('Payments');
  const [notify, setNotify] = React.useState(true);
  return (
    <Panel title="반영일정 등록" subtitle="새 반영 일정을 큐에 추가합니다" theme={theme} onClose={onClose} width={460}>
      <div style={panelStyles.formGrid}>
        <Field label="티켓번호">
          <input style={panelStyles.input} defaultValue="REL-2419" />
        </Field>
        <Field label="담당 팀">
          <select style={panelStyles.input} value={team} onChange={(e)=>setTeam(e.target.value)}>
            <option>Payments</option>
            <option>Search</option>
            <option>CX</option>
            <option>Admin</option>
            <option>BO</option>
          </select>
        </Field>
        <Field label="제목" full>
          <input style={panelStyles.input} placeholder="예) 결제 모듈 v2.3 핫픽스" />
        </Field>
        <Field label="반영 일자">
          <input style={panelStyles.input} type="date" defaultValue="2026-06-03" />
        </Field>
        <Field label="반영 시각">
          <input style={panelStyles.input} type="time" defaultValue="02:00" />
        </Field>
        <Field label="위험도" full>
          <div style={panelStyles.segWrap}>
            {[
              {k:'low',  label:'LOW',  c:'#047857'},
              {k:'med',  label:'MEDIUM', c:'#a16207'},
              {k:'high', label:'HIGH', c:'#b91c1c'},
            ].map(o => (
              <button
                key={o.k}
                onClick={()=>setRisk(o.k)}
                style={{
                  ...panelStyles.seg,
                  ...(risk === o.k ? { background:'#fff', boxShadow:'0 1px 2px rgba(15,23,42,0.08), 0 0 0 1px '+theme.line, color:o.c, fontWeight:600 } : { color:'#64748b' }),
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="비고 / 롤백 플랜" full>
          <textarea style={{...panelStyles.input, height:72, padding:'8px 10px', fontFamily:'inherit', resize:'none'}} placeholder="롤백 SQL, 모니터링 포인트 등을 적어주세요." />
        </Field>
      </div>
      <label style={panelStyles.checkRow}>
        <input type="checkbox" checked={notify} onChange={(e)=>setNotify(e.target.checked)} style={{accentColor: theme.primary}} />
        <span>등록 즉시 #release-ops 채널로 알림</span>
      </label>
      <div style={panelStyles.footer}>
        <button style={panelStyles.btnGhost} onClick={onClose}>취소</button>
        <button style={{...panelStyles.btnPrimary, background: theme.primary}}>일정 등록</button>
      </div>
    </Panel>
  );
};

const PlaceholderPanel = ({ title, theme, onClose }) => (
  <Panel title={title} subtitle="이 화면은 아직 mock 되지 않았습니다" theme={theme} onClose={onClose} width={380}>
    <div style={{
      padding: '36px 16px',
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: 13,
      lineHeight: 1.6,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
        background: theme.tint,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: theme.primary,
      }}>
        <Icon size={22}><circle cx="12" cy="12" r="8.5" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none" /></Icon>
      </div>
      이 메뉴는 디자인 단계의 placeholder예요.<br/>
      <span style={{color:'#cbd5e1'}}>주요 1–2개 패널만 자세히 mock 했습니다.</span>
    </div>
  </Panel>
);

const Field = ({ label, full, children }) => (
  <div style={{ gridColumn: full ? '1 / -1' : 'auto', display:'flex', flexDirection:'column', gap:5 }}>
    <span style={{ fontSize:11, color:'#64748b', fontWeight:500, letterSpacing:'0.01em' }}>{label}</span>
    {children}
  </div>
);

const Panel = ({ title, subtitle, theme, onClose, width = 440, children }) => (
  <div className="us-panel" style={{
    width,
    background: '#fff',
    borderRadius: 14,
    boxShadow: '0 30px 80px -20px rgba(15,23,42,0.25), 0 8px 24px -8px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.04)',
    border: '1px solid '+theme.line,
    overflow: 'hidden',
    display:'flex', flexDirection:'column',
    maxHeight: 'min(640px, calc(100vh - 48px))',
  }}>
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding: '14px 16px',
      borderBottom: '1px solid '+theme.line,
      background: theme.headerBg,
    }}>
      <div>
        <div style={{ fontSize:14, fontWeight:600, color:'#0f172a', letterSpacing:'-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontSize:11.5, color:'#64748b', marginTop:2 }}>{subtitle}</div>}
      </div>
      <button onClick={onClose} style={{
        appearance:'none', border:'none', background:'transparent',
        width:28, height:28, borderRadius:8, cursor:'pointer',
        color:'#94a3b8', display:'flex', alignItems:'center', justifyContent:'center',
      }} onMouseEnter={(e)=>e.currentTarget.style.background='#f1f5f9'} onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
        <IconClose size={16} />
      </button>
    </div>
    <div style={{ padding: '14px 16px', display:'flex', flexDirection:'column', gap:12, overflowY:'auto' }}>
      {children}
    </div>
  </div>
);

const panelStyles = {
  toolbar: { display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' },
  chips: { display:'flex', gap:6 },
  chip: {
    fontSize:12, padding:'4px 10px', borderRadius:999,
    background:'#f1f5f9', color:'#475569', fontWeight:500,
    cursor:'default', userSelect:'none',
  },
  chipOn: (theme) => ({ background: theme.tint, color: theme.primary, fontWeight:600 }),
  searchWrap: { flex:'1 1 200px', minWidth:160 },
  search: {
    width:'100%', boxSizing:'border-box', padding:'7px 10px',
    border:'1px solid #e2e8f0', borderRadius:8, outline:'none', fontSize:12,
    fontFamily:'inherit', color:'#0f172a',
  },
  table: { border:'1px solid #f1f5f9', borderRadius:10, overflow:'hidden' },
  thead: {
    display:'flex', gap:10, padding:'8px 12px',
    background:'#f8fafc', color:'#64748b',
    fontSize:11, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase',
  },
  tr: {
    display:'flex', gap:10, alignItems:'center',
    padding:'10px 12px', fontSize:13, color:'#0f172a',
    borderBottom:'1px solid #f1f5f9',
  },
  tag: {
    fontSize:10, fontWeight:700, letterSpacing:'0.04em',
    padding:'2px 7px', borderRadius:4, fontFamily:'ui-monospace, SF Mono, Menlo, monospace',
  },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  input: {
    width:'100%', boxSizing:'border-box',
    padding:'8px 10px', border:'1px solid #e2e8f0', borderRadius:8,
    outline:'none', fontSize:13, color:'#0f172a', background:'#fff',
    fontFamily:'inherit',
  },
  segWrap: {
    display:'flex', gap:4, padding:3, background:'#f1f5f9', borderRadius:8,
  },
  seg: {
    flex:1, appearance:'none', border:'none', background:'transparent',
    padding:'6px 10px', borderRadius:6, fontSize:12, cursor:'pointer',
    fontFamily:'inherit', letterSpacing:'0.04em',
  },
  checkRow: {
    display:'flex', alignItems:'center', gap:8,
    fontSize:12.5, color:'#475569', cursor:'pointer', userSelect:'none',
  },
  footer: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    paddingTop:6, marginTop:2, fontSize:12,
  },
  btnGhost: {
    appearance:'none', border:'1px solid #e2e8f0', background:'#fff',
    padding:'7px 12px', borderRadius:8, fontSize:12.5, color:'#334155',
    cursor:'pointer', fontFamily:'inherit', fontWeight:500,
  },
  btnPrimary: {
    appearance:'none', border:'none', color:'#fff',
    padding:'8px 14px', borderRadius:8, fontSize:13, fontWeight:600,
    cursor:'pointer', fontFamily:'inherit', letterSpacing:'-0.005em',
    boxShadow: '0 1px 2px rgba(15,23,42,0.1), inset 0 1px 0 rgba(255,255,255,0.18)',
  },
};

Object.assign(window, { SchedulePanel, RegisterPanel, PlaceholderPanel });
