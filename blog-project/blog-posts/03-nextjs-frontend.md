---
title: "Next.js로 AI 블로그 자동화 UI 만들기 — 5단계 워크플로우 구현"
date: 2026-04-14
tags: ["NextJS", "React", "블로그자동화", "UI구현", "TailwindCSS"]
meta_description: "키워드 입력부터 WordPress 발행까지 5단계 워크플로우를 Next.js 14 App Router와 Tailwind CSS로 구현한 방법을 공유합니다."
---

## 왜 Next.js인가

백엔드를 FastAPI로 만들었으니 프론트엔드는 어떤 것이든 붙일 수 있었다. Next.js를 선택한 이유는 하나다. `/api/*` 리라이트 기능으로 백엔드 URL을 브라우저에 노출하지 않고 프록시 처리할 수 있기 때문이다.

```javascript
// next.config.mjs
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.BACKEND_URL}/api/:path*`,
    },
  ];
}
```

브라우저는 `/api/generate`로 요청하지만 실제로는 `http://backend:8000/api/generate`로 전달된다. API 키가 브라우저 네트워크 탭에 노출되지 않는다.

---

## 5단계 컴포넌트 구조

```
app/
└── page.tsx              # 메인 페이지, 단계 상태 관리
    ├── StepInput.tsx     # Step 1: 키워드 + URL 입력
    ├── StepOutline.tsx   # Step 2: 개요 확인 및 편집
    ├── StepDraft.tsx     # Step 3: 본문 편집
    ├── StepImages.tsx    # Step 4: 이미지 선택
    └── StepPublish.tsx   # Step 5: 발행
```

`page.tsx`에서 현재 단계(`step`)와 각 단계의 데이터를 상태로 관리하고, 단계별 컴포넌트에 데이터와 콜백을 전달한다.

---

## Step 1 — 키워드 입력과 서브키워드 자동 추천

메인 키워드를 입력하면 AI가 SEO에 효과적인 서브키워드 5개를 자동으로 추천한다.

```typescript
async function handleSuggest() {
  const res = await fetch('/api/suggest-keywords', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });
  const data = await res.json();
  setSubKeywords(data.sub_keywords);
}
```

참고 URL을 입력하면 백엔드에서 해당 페이지 본문을 추출해 AI에 컨텍스트로 전달한다. 경쟁사 글이나 공식 자료를 참고해 더 정확한 내용을 생성할 수 있다.

---

## Step 2 — 개요 확인과 편집

AI가 제목 후보 3개와 섹션 구성을 생성하면 사용자가 선택하거나 수정할 수 있다.

```typescript
// 섹션 수정 가능
function updateSection(i: number, field: 'title' | 'points', value: string | string[]) {
  const next = outline.sections.map((s, idx) =>
    idx === i ? { ...s, [field]: value } : s
  );
  onUpdate({ ...outline, sections: next });
}
```

개요를 사람이 확인하고 수정한 뒤 본문 생성을 요청하는 방식이라 AI가 엉뚱한 방향으로 글을 쓰는 것을 방지할 수 있다.

---

## Step 3 — 본문 편집 (마크다운 + 미리보기)

본문은 마크다운으로 생성되고 `marked.js`로 HTML 변환 미리보기를 제공한다.

```typescript
// marked로 마크다운 → HTML 변환
const previewHtml = useMemo(
  () => marked.parse(draft.content) as string,
  [draft.content]
);
```

편집 탭과 미리보기 탭을 전환하면서 실시간으로 확인할 수 있다. 제목, 태그, 메타설명도 이 단계에서 수정 가능하다.

---

## Step 4 — Pixabay 이미지 선택

Pixabay API로 키워드 관련 이미지를 검색하고 썸네일로 사용할 이미지를 선택한다. 이미지 없이 건너뛰는 것도 가능하다.

```typescript
const res = await fetch(`/api/images?q=${encodeURIComponent(keyword)}&per_page=12`);
const data = await res.json();
setImages(data.hits);
```

---

## Step 5 — WordPress 발행

선택한 제목, 본문, 태그, 이미지를 WordPress REST API로 발행한다. 즉시 발행과 임시저장을 선택할 수 있다.

발행 성공 시 WordPress 포스트 URL이 반환된다.

---

## AI 응답 시간 대응

AI 본문 생성은 30초~1분이 걸린다. 이 시간 동안 버튼을 비활성화하고 로딩 상태를 표시한다.

```typescript
<button
  onClick={handleGenerate}
  disabled={loading}
  className="... disabled:bg-gray-700 disabled:text-gray-500 ..."
>
  {loading ? '본문 생성 중...' : '본문 생성 →'}
</button>
```

Next.js 프록시 타임아웃도 늘려줘야 한다. 기본값으로는 AI 생성 중 연결이 끊길 수 있다.

```javascript
// next.config.mjs
experimental: {
  proxyTimeout: 120000, // 2분
}
```

---

## 마치며

Next.js의 리라이트 기능과 컴포넌트 기반 구조 덕분에 5단계 워크플로우를 깔끔하게 구현할 수 있었다. 각 단계를 독립적인 컴포넌트로 분리해서 유지보수도 쉽다.

다음 편에서는 WordPress를 Docker로 띄우고 nginx 리버스 프록시와 Cloudflare로 커스텀 도메인을 연결하는 과정을 다룬다.

---

**📸 이미지 캡처 목록**
1. Step 1 화면 — 키워드 입력 + 서브키워드 추천 결과
2. Step 2 화면 — 제목 후보 3개 + 섹션 구성 편집
3. Step 3 화면 — 마크다운 편집 탭 / 미리보기 탭 나란히
4. Step 5 화면 — 발행 완료 후 WordPress URL 반환 화면
