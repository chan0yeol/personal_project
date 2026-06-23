'use client';

import { useState, useMemo } from 'react';
import { marked } from 'marked';
import type { Draft } from '@/app/page';

interface Props {
  draft: Draft;
  onUpdate: (d: Draft) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDraft({ draft, onUpdate, onNext, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const previewHtml = useMemo(() => marked.parse(draft.content) as string, [draft.content]);

  return (
    <div className="space-y-5">
      {/* 제목 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
        <input
          type="text"
          value={draft.title}
          onChange={e => onUpdate({ ...draft, title: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">태그</label>
        <input
          type="text"
          value={draft.tags.join(', ')}
          onChange={e => onUpdate({ ...draft, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="태그1, 태그2, 태그3"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* 메타 설명 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">메타 설명</label>
        <input
          type="text"
          value={draft.meta_description}
          onChange={e => onUpdate({ ...draft, meta_description: e.target.value })}
          maxLength={160}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
        />
        <p className="text-xs text-gray-600 mt-1">{draft.meta_description.length}/160</p>
      </div>

      {/* 본문 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">본문</label>
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['edit', 'preview'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                  ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {tab === 'edit' ? '편집' : '미리보기'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'edit' ? (
          <textarea
            value={draft.content}
            onChange={e => onUpdate({ ...draft, content: e.target.value })}
            rows={16}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 resize-y"
          />
        ) : (
          <div
            className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-4 prose prose-invert prose-sm max-w-none min-h-[400px]"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 rounded-lg transition-colors"
        >
          ← 돌아가기
        </button>
        <button
          onClick={onNext}
          className="flex-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          이미지 선택 →
        </button>
      </div>
    </div>
  );
}
