'use client';

import { useState } from 'react';
import type { SelectedImage } from '@/app/page';

interface Props {
  keyword: string;
  onSelect: (featured: SelectedImage, body: SelectedImage[]) => void;
  onSkip: () => void;
  onBack: () => void;
}

interface ImageItem {
  id: number;
  preview: string;
  full: string;
  thumb: string;
  tags: string;
  user: string;
}

type Mode = 'featured' | 'body';

export default function StepImages({ keyword, onSelect, onSkip, onBack }: Props) {
  const [query, setQuery] = useState(keyword);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [featured, setFeatured] = useState<ImageItem | null>(null);
  const [body, setBody] = useState<ImageItem[]>([]);
  const [mode, setMode] = useState<Mode>('featured');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const MAX_BODY = 5;

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch(`/api/images?keyword=${encodeURIComponent(query)}&count=18`);
      if (!res.ok) throw new Error('이미지 검색 실패');
      const data = await res.json();
      setImages(data.images || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleImage(img: ImageItem) {
    if (mode === 'featured') {
      setFeatured(featured?.id === img.id ? null : img);
      return;
    }
    if (featured?.id === img.id) return; // 대표 이미지는 본문 중복 선택 금지
    const exists = body.find(b => b.id === img.id);
    if (exists) {
      setBody(body.filter(b => b.id !== img.id));
    } else if (body.length < MAX_BODY) {
      setBody([...body, img]);
    }
  }

  function getImageState(img: ImageItem): { selected: boolean; label: string | null } {
    if (featured?.id === img.id) return { selected: true, label: '대표' };
    const idx = body.findIndex(b => b.id === img.id);
    if (idx >= 0) return { selected: true, label: `본문 ${idx + 1}` };
    return { selected: false, label: null };
  }

  function handleConfirm() {
    if (!featured) return;
    onSelect(
      { id: featured.id, preview: featured.preview, full: featured.full, tags: featured.tags, user: featured.user },
      body.map(b => ({ id: b.id, preview: b.preview, full: b.full, tags: b.tags, user: b.user })),
    );
  }

  return (
    <div className="space-y-5">
      {/* 모드 전환 */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('featured')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
            ${mode === 'featured' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          📌 대표 이미지 선택 {featured && '✓'}
        </button>
        <button
          onClick={() => setMode('body')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
            ${mode === 'body' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
        >
          🖼️ 본문 이미지 선택 ({body.length}/{MAX_BODY})
        </button>
      </div>

      {/* 검색 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="이미지 검색어 (본문 이미지는 다른 키워드로 검색해도 OK)"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={search}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          {loading ? '검색 중' : '검색'}
        </button>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      {/* 이미지 그리드 */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map(img => {
            const { selected, label } = getImageState(img);
            const isFeatured = featured?.id === img.id;
            return (
              <button
                key={img.id}
                onClick={() => toggleImage(img)}
                className={`relative aspect-video rounded-lg overflow-hidden ring-2 transition-all
                  ${selected ? (isFeatured ? 'ring-indigo-500' : 'ring-emerald-500') + ' scale-95' : 'ring-transparent hover:ring-gray-600'}`}
              >
                <img src={img.preview} alt={img.tags} className="w-full h-full object-cover" />
                {selected && (
                  <div className={`absolute top-1 left-1 px-2 py-0.5 rounded-md text-xs font-bold text-white
                    ${isFeatured ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                    {label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {searched && images.length === 0 && !loading && (
        <p className="text-gray-500 text-sm text-center py-8">검색 결과가 없습니다.</p>
      )}

      {/* 선택 요약 */}
      <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-400 space-y-1">
        <p>📌 대표: {featured ? `${featured.tags.split(',')[0]}` : '미선택'}</p>
        <p>🖼️ 본문: {body.length}장 {body.length > 0 && `(H2 섹션 사이에 자동 삽입)`}</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-lg transition-colors">
          ← 돌아가기
        </button>
        <button onClick={onSkip} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 font-semibold py-3 rounded-lg transition-colors">
          건너뛰기
        </button>
        <button
          onClick={handleConfirm}
          disabled={!featured}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          선택 완료 →
        </button>
      </div>
    </div>
  );
}
