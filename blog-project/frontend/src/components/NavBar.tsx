'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const path = usePathname();

  return (
    <nav className="border-b border-gray-800 bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 flex gap-1 h-12 items-center">
        <Link
          href="/"
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            path === '/'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          건강 블로그
        </Link>
        <Link
          href="/hugo"
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            path.startsWith('/hugo')
              ? 'bg-emerald-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          개발 블로그
        </Link>
      </div>
    </nav>
  );
}
