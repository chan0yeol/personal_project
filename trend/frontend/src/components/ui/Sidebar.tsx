'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/comparison', label: '키워드 비교', icon: '⚖️' },
  { href: '/ranking', label: '실시간 순위', icon: '🏆' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-5 py-6 border-b border-gray-800">
        <h1 className="text-lg font-bold text-indigo-400 tracking-tight">Trend Insights</h1>
        <p className="text-xs text-gray-500 mt-0.5">Google · Naver 통합</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600">매 1시간 자동 갱신</p>
      </div>
    </aside>
  );
}
