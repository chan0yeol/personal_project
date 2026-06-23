const NAV_ITEMS = [
  {
    id: 'map',
    label: '지도',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinejoin="round"
          fill={active ? '#EDE7FF' : 'none'} />
        <path d="M9 4v14M15 6v14" stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'videos',
    label: '영상',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="3"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2"
          fill={active ? '#EDE7FF' : 'none'} />
        <path d="M10 9l6 3-6 3V9z"
          fill={active ? '#7C3AED' : '#9B94AD'} />
      </svg>
    ),
  },
  {
    id: 'gatherings',
    label: '모임',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" fill={active ? '#EDE7FF' : 'none'} />
        <circle cx="17" cy="8" r="2.5" stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="1.8" fill={active ? '#EDE7FF' : 'none'} />
        <path d="M2 19c1-3.5 3.5-5 7-5s6 1.5 7 5" stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinecap="round" />
        <path d="M19 14c1.5.5 2.5 1.8 3 4" stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'favorites',
    label: '찜',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#7C3AED' : 'none'}>
        <path d="M12 21s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 11c0 5.5-7 10-7 10Z"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'events',
    label: '이벤트',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 10h16v10H4z"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2"
          fill={active ? '#EDE7FF' : 'none'} />
        <path d="M3 7h18v3H3zM12 7v13M9 7s-3-3 0-3 3 3 3 3M15 7s3-3 0-3-3 3-3 3"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'my',
    label: '마이',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="3.5"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2"
          fill={active ? '#EDE7FF' : 'none'} />
        <path d="M5 20c1-4 4-6 7-6s6 2 7 6"
          stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

const ADMIN_ITEM = {
  id: 'admin',
  label: '신고',
  icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 19h20L12 2Z"
        stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinejoin="round"
        fill={active ? '#EDE7FF' : 'none'} />
      <path d="M12 9v5M12 16.5v.5"
        stroke={active ? '#7C3AED' : '#9B94AD'} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

export default function BottomNav({ activeTab, onTabChange, isAdmin }) {
  const items = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

  return (
    <nav className="bg-white border-t flex items-stretch shrink-0 relative z-20"
      style={{
        borderColor: '#EDEAF2',
        boxShadow: '0 -4px 18px rgba(31,17,68,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      {items.map(item => {
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-all"
            style={{ minHeight: 56 }}
          >
            {item.icon(active)}
            <span className="text-[11px] font-bold leading-none transition-colors"
              style={{ color: active ? '#7C3AED' : '#9B94AD', letterSpacing: '-0.2px' }}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
