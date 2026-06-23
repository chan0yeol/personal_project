'use client';

import { useState, useEffect } from 'react';

type PixabayImage = {
  id: number;
  preview: string;
  full: string;
  tags: string;
  user: string;
};

type Props = {
  topic: string;
  onNext: (coverUrl: string, bodyUrl: string) => void;
  onBack: () => void;
};

export default function HugoStepImages({ topic, onNext, onBack }: Props) {
  const [query, setQuery] = useState(topic);
  const [images, setImages] = useState<PixabayImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [coverUrl, setCoverUrl] = useState('');
  const [bodyUrl, setBodyUrl] = useState('');
  const [error, setError] = useState('');

  const search = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/images?keyword=${encodeURIComponent(q)}&count=12`);
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setError('이미지 검색 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { search(topic); }, [topic]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search(query)}
          placeholder="검색어..."
        />
        <button
          onClick={() => search(query)}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          검색
        </button>
      </div>

      {/* 선택 현황 */}
      <div className="flex gap-4 text-sm">
        <div className={`flex-1 border rounded p-2 text-center ${coverUrl ? 'border-emerald-500 text-emerald-400' : 'border-gray-700 text-gray-500'}`}>
          {coverUrl ? '대표 이미지 선택됨' : '대표 이미지 미선택'}
        </div>
        <div className={`flex-1 border rounded p-2 text-center ${bodyUrl ? 'border-blue-500 text-blue-400' : 'border-gray-700 text-gray-500'}`}>
          {bodyUrl ? '본문 이미지 선택됨' : '본문 이미지 미선택'}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-500 text-sm py-8">검색 중...</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map(img => {
            const isCover = coverUrl === img.full;
            const isBody  = bodyUrl  === img.full;
            return (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt={img.tags}
                  className={`w-full h-28 object-cover rounded cursor-pointer border-2 transition-all ${
                    isCover ? 'border-emerald-500' : isBody ? 'border-blue-500' : 'border-transparent'
                  }`}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex flex-col items-center justify-center gap-1">
                  <button
                    onClick={() => setCoverUrl(isCover ? '' : img.full)}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 rounded text-xs text-white"
                  >
                    {isCover ? '대표 해제' : '대표'}
                  </button>
                  <button
                    onClick={() => setBodyUrl(isBody ? '' : img.full)}
                    className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white"
                  >
                    {isBody ? '본문 해제' : '본문'}
                  </button>
                </div>
                {isCover && <span className="absolute top-1 left-1 bg-emerald-600 text-white text-xs px-1 rounded">대표</span>}
                {isBody  && <span className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">본문</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={() => onNext(coverUrl, bodyUrl)}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-medium transition-colors"
        >
          {coverUrl ? '배포 →' : '이미지 없이 배포 →'}
        </button>
      </div>
    </div>
  );
}
