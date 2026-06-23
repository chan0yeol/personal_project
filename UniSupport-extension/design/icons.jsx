// icons.jsx — simple stroke icons for the FAB menu.
// All built from primitive shapes (rect/line/circle/polyline) so they stay neutral.

const Icon = ({ children, size = 18, stroke = 'currentColor', strokeWidth = 1.6 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

// 반영일정 조회 — calendar + list rows
const IconScheduleView = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <line x1="7" y1="14" x2="13" y2="14" />
    <line x1="7" y1="17" x2="17" y2="17" />
  </Icon>
);

// 반영일정 등록 — calendar + plus
const IconScheduleAdd = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="3" x2="8" y2="7" />
    <line x1="16" y1="3" x2="16" y2="7" />
    <line x1="12" y1="13" x2="12" y2="18" />
    <line x1="9.5" y1="15.5" x2="14.5" y2="15.5" />
  </Icon>
);

// 날짜 조회 — clock-on-calendar (simple clock)
const IconDate = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <polyline points="12 7 12 12 15.5 14" />
  </Icon>
);

// 설정한 조건 조회 — filter funnel
const IconFilter = (props) => (
  <Icon {...props}>
    <polygon points="3.5 5 20.5 5 14 13 14 19 10 21 10 13 3.5 5" />
  </Icon>
);

// 검색 설정 — magnifier + sliders
const IconSearchSettings = (props) => (
  <Icon {...props}>
    <circle cx="10.5" cy="10.5" r="5.5" />
    <line x1="14.5" y1="14.5" x2="20" y2="20" />
    <line x1="8" y1="10.5" x2="13" y2="10.5" />
    <circle cx="10.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

// 사용법 — help mark in circle
const IconHelp = (props) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.5 9.2a2.5 2.5 0 0 1 4.9 0.6c0 1.4-1.9 1.8-1.9 3.2" />
    <circle cx="12.5" cy="16.4" r="0.6" fill="currentColor" stroke="none" />
  </Icon>
);

// chevron used inside the FAB itself
const IconPlus = (props) => (
  <Icon {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </Icon>
);

const IconClose = (props) => (
  <Icon {...props}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </Icon>
);

// six-dot drag handle
const IconDragDots = (props) => (
  <Icon {...props} strokeWidth={0}>
    <circle cx="9" cy="6" r="1.2" fill="currentColor" />
    <circle cx="15" cy="6" r="1.2" fill="currentColor" />
    <circle cx="9" cy="12" r="1.2" fill="currentColor" />
    <circle cx="15" cy="12" r="1.2" fill="currentColor" />
    <circle cx="9" cy="18" r="1.2" fill="currentColor" />
    <circle cx="15" cy="18" r="1.2" fill="currentColor" />
  </Icon>
);

Object.assign(window, {
  Icon,
  IconScheduleView, IconScheduleAdd, IconDate,
  IconFilter, IconSearchSettings, IconHelp,
  IconPlus, IconClose, IconDragDots,
});
