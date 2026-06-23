'use client';

import { useState } from 'react';
import type { Outline, OutlineSection, Draft } from '@/app/page';

interface Props {
  keyword: string;
  tone: string;
  outline: Outline;
  onUpdate: (o: Outline) => void;
  onNext: (draft: Draft) => void;
  onBack: () => void;
}

export default function StepOutline({ keyword, tone, outline, onUpdate, onNext, onBack }: Props) {
  const [selectedTitle, setSelectedTitle] = useState(outline.title_candidates[0] ?? '');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const activeTitle = customTitle.trim() || selectedTitle;

  function updateSection(i: number, field: 'title' | 'points', value: string | string[]) {
    const next = outline.sections.map((s, idx) =>
      idx === i ? { ...s, [field]: value } : s
    );
    onUpdate({ ...outline, sections: next });
  }

  function updatePoint(sectionIdx: number, pointIdx: number, value: string) {
    const points = outline.sections[sectionIdx].points.map((p, i) =>
      i === pointIdx ? value : p
    );
    updateSection(sectionIdx, 'points', points);
  }

  async function handleGenerate() {
    if (!activeTitle.trim()) { setError('제목을 선택하거나 입력해주세요.'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          tone,
          title: activeTitle,
          sections: outline.sections,
          tags: outline.tags,
          meta_description: outline.meta_description,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        let detail = '본문 생성 실패';
        try { detail = JSON.parse(text).detail || detail; } catch {}
        throw new Error(detail);
      }

      const draft: Draft = await res.json();
      onNext(draft);
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 제목 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          제목 선택 <span className="text-gray-500 font-normal">(클릭해서 선택 또는 직접 입력)</span>
        </label>
        <div className="space-y-2 mb-3">
          {outline.title_candidates.map((t, i) => (
            <button
              key={i}
              onClick={() => { setSelectedTitle(t); setCustomTitle(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm border transition-colors
                ${selectedTitle === t && !customTitle.trim()
                  ? 'bg-indigo-600/20 border-indigo-500 text-white'
                  : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={customTitle}
          onChange={e => setCustomTitle(e.target.value)}
          placeholder="직접 입력 (선택 사항)"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 text-sm"
        />
        {activeTitle && (
          <p className="text-xs text-indigo-300 mt-1.5">
            선택된 제목: <span className="font-medium">{activeTitle}</span>
          </p>
        )}
      </div>

      {/* 섹션 구성 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          섹션 구성 <span className="text-gray-500 font-normal">(제목·포인트 수정 가능)</span>
        </label>
        <div className="space-y-3">
          {outline.sections.map((section, si) => (
            <div key={si} className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
              <input
                type="text"
                value={section.title}
                onChange={e => updateSection(si, 'title', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
              />
              <div className="space-y-1 pl-2">
                {section.points.map((point, pi) => (
                  <div key={pi} className="flex items-center gap-2">
                    <span className="text-gray-600 text-xs">•</span>
                    <input
                      type="text"
                      value={point}
                      onChange={e => updatePoint(si, pi, e.target.value)}
                      className="flex-1 bg-transparent border-b border-gray-700 px-1 py-1 text-gray-400 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">태그</label>
        <input
          type="text"
          value={outline.tags.join(', ')}
          onChange={e => onUpdate({ ...outline, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
        />
      </div>

      {/* 메타 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">메타 설명</label>
        <input
          type="text"
          value={outline.meta_description}
          onChange={e => onUpdate({ ...outline, meta_description: e.target.value })}
          maxLength={160}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
        />
        <p className="text-xs text-gray-600 mt-1">{outline.meta_description.length}/160</p>
      </div>

      {error && <p className="text-rose-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-semibold py-3 rounded-lg transition-colors"
        >
          ← 돌아가기
        </button>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          {loading ? '본문 생성 중...' : '본문 생성 →'}
        </button>
      </div>
    </div>
  );
}
