'use client';

import { useState } from 'react';
import HugoStepInput from '@/components/hugo/HugoStepInput';
import HugoStepOutline from '@/components/hugo/HugoStepOutline';
import HugoStepDraft from '@/components/hugo/HugoStepDraft';
import HugoStepImages from '@/components/hugo/HugoStepImages';
import HugoStepDeploy from '@/components/hugo/HugoStepDeploy';

export type HugoOutlineSection = {
  title: string;
  points: string[];
};

export type HugoOutline = {
  title_candidates: string[];
  sections: HugoOutlineSection[];
  tags: string[];
  description: string;
  slug: string;
};

export type HugoDraft = {
  title: string;
  slug: string;
  front_matter: string;
  content: string;
  full_md: string;
  tags: string[];
  categories: string[];
  description: string;
  provider: string;
};

const STEPS = ['주제 입력', '개요 확인', '본문 편집', '이미지 선택', '배포'];

export default function HugoPage() {
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [postType, setPostType] = useState('tutorial');
  const [outline, setOutline] = useState<HugoOutline | null>(null);
  const [draft, setDraft] = useState<HugoDraft | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [bodyUrl, setBodyUrl] = useState('');

  const reset = () => {
    setStep(0);
    setTopic('');
    setCategories([]);
    setPostType('tutorial');
    setOutline(null);
    setDraft(null);
    setCoverUrl('');
    setBodyUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">개발 블로그 자동 생성</h1>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center mb-10 gap-0">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-emerald-600 text-white ring-2 ring-emerald-300' : 'bg-gray-800 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 whitespace-nowrap ${i === step ? 'text-emerald-300' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < step ? 'bg-emerald-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 스텝 콘텐츠 */}
        {step === 0 && (
          <HugoStepInput
            onNext={(t, cats, pt, ol) => {
              setTopic(t);
              setCategories(cats);
              setPostType(pt);
              setOutline(ol);
              setStep(1);
            }}
          />
        )}
        {step === 1 && outline && (
          <HugoStepOutline
            topic={topic}
            categories={categories}
            postType={postType}
            outline={outline}
            onUpdate={setOutline}
            onNext={(d) => { setDraft(d); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && draft && (
          <HugoStepDraft
            draft={draft}
            onUpdate={setDraft}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && draft && (
          <HugoStepImages
            topic={topic}
            onNext={(cv, bv) => { setCoverUrl(cv); setBodyUrl(bv); setStep(4); }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && draft && (
          <HugoStepDeploy
            draft={draft}
            coverUrl={coverUrl}
            bodyUrl={bodyUrl}
            onBack={() => setStep(3)}
            onDone={reset}
          />
        )}
      </div>
    </div>
  );
}
