import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: '블로그 자동 생성',
  description: '키워드와 URL로 블로그 초안을 자동 생성합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">
        <NavBar />
        {children}
      </body>
    </html>
  );
}
