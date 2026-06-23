'use client';

import { useState } from 'react';
import type { HugoOutline, HugoDraft } from '@/app/hugo/page';

type Props = {
  topic: string;
  categories: string[];
  postType: string;
  outline: HugoOutline;
  onUpdate: (outline: HugoOutline) => void;
  onNext: (draft: HugoDraft) => void;
  onBack: () => void;
};

export default function HugoStepOutline({ topic, categories, postType, outline, onUpdate, onNext, onBack }: Props) {
  const [selectedTitle, setSelectedTitle] = useState(outline.title_candidates[0] || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNext = async () => {
    if (!selectedTitle.trim()) { setError('제목을 선택하세요.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hugo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title: selectedTitle,
          slug: outline.slug,
          sections: outline.sections,
          tags: outline.tags,
          categories,
          description: outline.description,
          post_type: postType,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      onNext({
        title: selectedTitle,
        slug: data.slug,
        front_matter: data.front_matter,
        content: data.content,
        full_md: data.full_md,
        tags: outline.tags,
        categories,
        description: data.description || outline.description,
        provider: data.provider,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '본문 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">제목 선택</label>
        <div className="space-y-2">
          {outline.title_candidates.map((t, i) => (
            <button
              key={i}
              onClick={() => setSelectedTitle(t)}
              className={`w-full text-left px-4 py-3 rounded border text-sm transition-colors ${
                selectedTitle === t
                  ? 'bg-emerald-900 border-emerald-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          className="mt-2 w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          placeholder="직접 입력..."
          value={selectedTitle}
          onChange={e => setSelectedTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">섹션 구성</label>
        <div className="space-y-2">
          {outline.sections.map((s, i) => (
            <div key={i} className="bg-gray-900 rounded border border-gray-700 p-3">
              <p className="text-sm font-medium text-gray-200 mb-1">## {s.title}</p>
              <ul className="space-y-0.5">
                {s.points.map((p, j) => (
                  <li key={j} className="text-xs text-gray-500">• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">slug</label>
          <input
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            value={outline.slug}
            onChange={e => onUpdate({ ...outline, slug: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">태그</label>
          <p className="text-xs text-gray-500 mt-1">{outline.tags.join(', ')}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">description</label>
        <textarea
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          rows={2}
          value={outline.description}
          onChange={e => onUpdate({ ...outline, description: e.target.value })}
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
        >
          ← 이전
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded font-medium transition-colors"
        >
          {loading ? '생성 중...' : '본문 생성 →'}
        </button>
      </div>
    </div>
  );
}
