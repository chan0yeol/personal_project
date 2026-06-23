'use client';

import { useState } from 'react';
import StepInput from '@/components/StepInput';
import StepOutline from '@/components/StepOutline';
import StepDraft from '@/components/StepDraft';
import StepImages from '@/components/StepImages';
import StepPublish from '@/components/StepPublish';

export type OutlineSection = {
  title: string;
  points: string[];
};

export type Outline = {
  title_candidates: string[];
  sections: OutlineSection[];
  tags: string[];
  meta_description: string;
};

export type Draft = {
  title: string;
  content: string;
  tags: string[];
  meta_description: string;
};

export type SelectedImage = {
  id: number;
  preview: string;
  full: string;
  tags: string;
  user: string;
};

const STEPS = ['키워드 & URL', '개요 확인', '본문 편집', '이미지 선택', '발행'];

export default function Home() {
  const [step, setStep] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [tone, setTone] = useState('informative');
  const [outline, setOutline] = useState<Outline | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [bodyImages, setBodyImages] = useState<SelectedImage[]>([]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* 헤더 */}
        <h1 className="text-2xl font-bold text-white mb-8">블로그 자동 생성</h1>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center mb-10 gap-0">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${i < step ? 'bg-indigo-500 text-white' : i === step ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 'bg-gray-800 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 whitespace-nowrap ${i === step ? 'text-indigo-300' : 'text-gray-600'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < step ? 'bg-indigo-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* 스텝 콘텐츠 */}
        {step === 0 && (
          <StepInput
            onNext={(kw, t, ol) => { setKeyword(kw); setTone(t); setOutline(ol); setStep(1); }}
          />
        )}
        {step === 1 && outline && (
          <StepOutline
            keyword={keyword}
            tone={tone}
            outline={outline}
            onUpdate={setOutline}
            onNext={(d) => { setDraft(d); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && draft && (
          <StepDraft
            draft={draft}
            onUpdate={setDraft}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && draft && (
          <StepImages
            keyword={keyword}
            onSelect={(featured, body) => { setImage(featured); setBodyImages(body); setStep(4); }}
            onSkip={() => { setBodyImages([]); setStep(4); }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && draft && (
          <StepPublish
            draft={draft}
            image={image}
            bodyImages={bodyImages}
            onBack={() => setStep(3)}
            onDone={() => { setStep(0); setOutline(null); setDraft(null); setImage(null); setBodyImages([]); setKeyword(''); }}
          />
        )}
      </div>
    </div>
  );
}
