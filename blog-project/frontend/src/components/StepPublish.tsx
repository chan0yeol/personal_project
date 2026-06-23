'use client';

import { useState } from 'react';
import type { Draft, SelectedImage } from '@/app/page';

interface Props {
  draft: Draft;
  image: SelectedImage | null;
  bodyImages?: SelectedImage[];
  onBack: () => void;
  onDone: () => void;
}

export default function StepPublish({ draft, image, bodyImages = [], onBack, onDone }: Props) {
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ post_id: number; url: string; status: string } | null>(null);
  const [error, setError] = useState('');

  async function handlePublish() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
          tags: draft.tags,
          status,
          image_url: image?.full ?? null,
          body_images: bodyImages.map(b => ({ url: b.full, alt: b.tags.split(',')[0]?.trim() || draft.title })),
          meta_description: draft.meta_description,
          focus_keyword: draft.tags[0] ?? "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '발행 실패');
      }

      setResult(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="text-5xl">🎉</div>
        <div>
          <p className="text-xl font-bold text-white mb-1">
            {result.status === 'publish' ? '발행 완료!' : '임시저장 완료!'}
          </p>
          <p className="text-gray-400 text-sm">Post ID: {result.post_id}</p>
        </div>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
        >
          포스트 보기 →
        </a>
        <div>
          <button onClick={onDone} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            새 글 작성하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 */}
      <div className="bg-gray-900 rounded-xl p-5 space-y-3">
        <div className="flex gap-4">
          {image && (
            <img src={image.preview} alt="selected" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{draft.title}</p>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{draft.meta_description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {draft.tags.map(tag => (
                <span key={tag} className="bg-gray-800 text-indigo-300 text-xs px-2 py-0.5 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>
        </div>
        {!image && <p className="text-xs text-gray-600">이미지 없음</p>}
      </div>

      {/* 발행 상태 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">발행 옵션</label>
        <div className="flex gap-3">
          {[
            { value: 'draft', label: '임시저장', desc: '나중에 검토 후 발행' },
            { value: 'publish', label: '즉시 발행', desc: '지금 바로 공개' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value as 'draft' | 'publish')}
              className={`flex-1 p-4 rounded-xl border-2 text-left transition-all
                ${status === opt.value ? 'border-indigo-500 bg-indigo-950' : 'border-gray-700 bg-gray-900 hover:border-gray-600'}`}
            >
              <p className={`font-semibold text-sm ${status === opt.value ? 'text-indigo-300' : 'text-gray-300'}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-lg transition-colors">
          ← 돌아가기
        </button>
        <button
          onClick={handlePublish}
          disabled={loading}
          className="flex-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          {loading ? '발행 중...' : status === 'publish' ? '발행하기' : '임시저장'}
        </button>
      </div>
    </div>
  );
}
