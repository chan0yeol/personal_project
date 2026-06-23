// app.jsx — root: theme registry, state, tweaks panel wiring.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "size": 56,
  "colorTheme": "ocean",
  "animStyle": "stagger",
  "showHostHint": true
}/*EDITMODE-END*/;

// curated enterprise-blue palettes. each one has primary/dark/light/tint/etc.
const THEMES = {
  ocean:    mkTheme({ name:'Ocean',    primary:'#2563EB', dark:'#1d4ed8', light:'#3b82f6', tint:'#eff6ff', shadow:'rgba(37,99,235,0.35)'   }),
  steel:    mkTheme({ name:'Steel',    primary:'#1e3a8a', dark:'#172554', light:'#1e40af', tint:'#eef2ff', shadow:'rgba(30,58,138,0.35)'   }),
  teal:     mkTheme({ name:'Teal',     primary:'#0e7490', dark:'#155e75', light:'#0891b2', tint:'#ecfeff', shadow:'rgba(14,116,144,0.35)'  }),
  slate:    mkTheme({ name:'Slate',    primary:'#334155', dark:'#0f172a', light:'#475569', tint:'#f1f5f9', shadow:'rgba(15,23,42,0.30)'    }),
};

function mkTheme(t) {
  return {
    name: t.name,
    primary: t.primary,
    primaryDark: t.dark,
    primaryLight: t.light,
    primaryShadow: t.shadow,
    tint: t.tint,
    line: '#e2e8f0',
    borderHover: '#cbd5e1',
    headerBg: '#ffffff',
  };
}

const PANEL_RENDERERS = {
  view:     SchedulePanel,
  register: RegisterPanel,
  search:   SearchSettingsPanel,
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = THEMES[t.colorTheme] || THEMES.ocean;

  const [open, setOpen] = React.useState(false);
  const [activePanel, setActivePanel] = React.useState(null); // menu key or null
  const [pos, setPos] = React.useState({ x: 28, y: 28 }); // distance from right/bottom

  // close menu on Esc
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (activePanel) setActivePanel(null);
        else if (open) setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, activePanel]);

  // dismiss menu by clicking outside the FAB stack (but ignore panel clicks)
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const target = e.target;
      if (target.closest && (target.closest('[data-fab-root]') || target.closest('.us-panel'))) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [open]);

  const ActivePanelComp = activePanel
    ? (PANEL_RENDERERS[activePanel] || ((props) => (
        <PlaceholderPanel
          {...props}
          title={(MENU.find(m => m.key === activePanel) || {}).label || ''}
        />
      )))
    : null;

  // panel anchor — top edge of FAB area, offset away from the fab
  const panelAnchor = {
    position: 'fixed',
    right: pos.x + t.size + 16,
    bottom: pos.y,
    zIndex: 2147483599,
  };

  return (
    <div data-fab-root>
      {/* host hint visibility */}
      <style>{`.us-host-hint { display: ${t.showHostHint ? 'block' : 'none'}; }`}</style>

      {/* the panel renders to the left of the FAB */}
      {ActivePanelComp && (
        <div style={panelAnchor}>
          <ActivePanelComp theme={theme} onClose={() => setActivePanel(null)} />
        </div>
      )}

      <FAB
        theme={theme}
        size={t.size}
        animKey={t.animStyle}
        open={open}
        setOpen={setOpen}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        pos={pos}
        setPos={setPos}
      />

      <TweaksPanel>
        <TweakSection label="FAB" />
        <TweakSlider
          label="크기"
          value={t.size}
          min={44} max={76} step={2} unit="px"
          onChange={(v) => setTweak('size', v)}
        />
        <TweakSelect
          label="색상 테마"
          value={t.colorTheme}
          options={Object.keys(THEMES).map(k => ({ value: k, label: THEMES[k].name }))}
          onChange={(v) => setTweak('colorTheme', v)}
        />

        <TweakSection label="펼침 애니메이션" />
        <TweakRadio
          label="스타일"
          value={t.animStyle}
          options={[
            { value: 'slide',   label: 'Slide'   },
            { value: 'stagger', label: 'Stagger' },
            { value: 'scale',   label: 'Pop'     },
          ]}
          onChange={(v) => setTweak('animStyle', v)}
        />

        <TweakSection label="프리뷰" />
        <TweakToggle
          label="호스트 페이지 힌트 표시"
          value={t.showHostHint}
          onChange={(v) => setTweak('showHostHint', v)}
        />
        <TweakButton
          label={open ? '메뉴 닫기' : '메뉴 열기 (미리보기)'}
          onClick={() => { setActivePanel(null); setOpen(o => !o); }}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
