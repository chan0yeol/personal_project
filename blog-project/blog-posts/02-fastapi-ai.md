---
title: "Gemini → Solar → Groq 3중 폴백 — 무료 AI API로 한국어 블로그 자동화하기"
date: 2026-04-14
tags: ["FastAPI", "GeminiAPI", "SolarAPI", "Groq", "프롬프트엔지니어링"]
meta_description: "Gemini, Upstage Solar, Groq을 3중 폴백으로 연동해 무료로 한국어 블로그 본문을 자동 생성하는 FastAPI 백엔드 구현 방법을 공유합니다."
---

## AI API를 하나만 쓰면 안 되는 이유

처음에는 Gemini API 하나만 연동했다. 무료 티어에 한국어 품질도 좋아서 충분하다고 생각했다.

하지만 실제 운영해보니 문제가 생겼다.

- **분당 요청 한도** 초과 시 429 오류
- **일일 한도** 소진 시 그날 더 이상 사용 불가
- **일시적 503** 오류 (서버 과부하)

단일 API에 의존하면 이 중 하나만 발생해도 전체 시스템이 멈춘다. 그래서 **3중 폴백 구조**를 설계했다.

```
Gemini 2.0 Flash (1순위)
    ↓ 실패 시
Upstage Solar Pro (2순위)
    ↓ 실패 시
Groq llama-3.3-70b (3순위)
```

---

## 폴백 구조 구현

```python
def _generate_with_fallback(prompt: str) -> tuple[dict, str]:
    for attempt in range(1):
        temperature = 0.6

        # 1. Gemini 시도
        if os.getenv("GEMINI_API_KEY"):
            try:
                result = _call_gemini(prompt, temperature)
                if not _has_foreign_chars(result.get("content", "")):
                    return result, "gemini"
            except Exception as e:
                logger.warning(f"Gemini 실패: {e} → Solar 폴백")

        # 2. Solar 폴백
        if os.getenv("UPSTAGE_API_KEY"):
            try:
                result = _call_solar(prompt, temperature)
                if not _has_foreign_chars(result.get("content", "")):
                    return result, "solar"
            except Exception as e:
                logger.warning(f"Solar 실패: {e} → Groq 폴백")

        # 3. Groq 폴백
        if os.getenv("GROQ_API_KEY"):
            try:
                result = _call_groq(prompt, temperature)
                if not _has_foreign_chars(result.get("content", "")):
                    return result, "groq"
            except Exception as e:
                logger.warning(f"Groq 실패: {e}")

    raise HTTPException(status_code=500, detail="모든 AI 생성 실패")
```

각 API 호출 후 **외국어 문자 감지**를 수행한다. llama 계열 모델은 한국어 생성 중 가끔 한자나 러시아어가 섞이는 문제가 있어서, 이를 감지하면 실패로 처리하고 다음 API로 넘긴다.

---

## 각 API 연동 방법

### Gemini

```python
from google import genai
from google.genai import types

def _call_gemini(prompt: str, temperature: float = 0.6) -> dict:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    response = client.models.generate_content(
        model=model,
        contents=f"{SYSTEM_PROMPT}\n\n{prompt}",
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)
```

`response_mime_type="application/json"` 설정으로 Gemini가 항상 JSON만 반환하도록 강제한다.

### Upstage Solar

Solar는 OpenAI API 형식과 호환된다. `openai` 패키지에 base_url만 바꾸면 바로 사용 가능하다.

```python
from openai import OpenAI

def _call_solar(prompt: str, temperature: float = 0.6) -> dict:
    client = OpenAI(
        api_key=os.getenv("UPSTAGE_API_KEY"),
        base_url="https://api.upstage.ai/v1"
    )
    response = client.chat.completions.create(
        model="solar-pro",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
```

Solar Pro는 한국어 특화 모델이라 건강·영양 블로그 콘텐츠 품질이 특히 좋다. 가입 시 $10 무료 크레딧을 주기 때문에 초기에는 비용 없이 사용할 수 있다.

---

## 한국어 건강 블로그 프롬프트 설계

AI에게 역할을 명확히 주는 것이 중요하다. 시스템 프롬프트에 "건강·영양 정보 전문 블로그 작가" 페르소나를 부여했다.

```python
SYSTEM_PROMPT = (
    "당신은 건강·영양 정보에 정통한 한국어 블로그 전문 작가입니다. "
    "구글 SEO와 애드센스 승인 기준에 맞는 고품질 건강 정보 글을 씁니다. "
    "글쓰기 원칙: 구체적인 수치(mg, IU, %, 권장량)와 실생활 예시를 반드시 포함합니다. "
    "독자가 읽고 바로 실천할 수 있는 실용적인 정보를 제공합니다. "
    "절대 규칙: 한국어와 기본 영숫자만 사용하세요. "
    "JSON 형식 외에 다른 텍스트를 출력하지 마세요."
)
```

본문 생성 프롬프트의 핵심 규칙:

```
- 전체 본문 2000자 이상
- 각 섹션 최소 400자, 구체적 수치(mg, IU, %) 1개 이상 포함
- 효능 섹션: 번호 목록으로 구체적 효과 나열
- 복용법 섹션: 하루 권장량, 복용 시간, 궁합 좋은 성분 포함
- 부작용 섹션: 과다복용 증상, 주의 대상 명시
- 의학적 치료/완치 표현 금지
- 마치며: 전문가 상담 권장 문구 포함
```

이 규칙을 지키면 애드센스 심사에서 문제가 되는 과장 광고, 치료 표현 등을 자동으로 피할 수 있다.

---

## 무료 API 한도 비교

| API | 무료 한도 | 한국어 품질 | 비고 |
|-----|---------|------------|------|
| Gemini 2.0 Flash | 분당 15회, 일 1500회 | 최상 | billing 비활성화 시 무료 |
| Upstage Solar Pro | $10 크레딧 | 상 | 가입 시 제공 |
| Groq llama-3.3-70b | 분당 30회 | 중 | 완전 무료 |

블로그 자동화 수준(하루 5~10개 글)이라면 세 API 모두 무료 한도 내에서 충분히 운영 가능하다.

---

## 마치며

3중 폴백 구조 덕분에 어느 하나의 API가 막혀도 자동으로 다음으로 넘어간다. Gemini 할당량이 소진되면 Solar가, Solar도 안 되면 Groq이 처리한다.

무료 API만으로 안정적인 AI 블로그 자동화 시스템을 구축할 수 있다는 게 핵심이다.

다음 편에서는 Next.js 프론트엔드의 5단계 워크플로우 구현을 다룬다.

---

**📸 이미지 캡처 목록**
1. 백엔드 로그 화면 — Gemini 실패 후 Solar 폴백되는 로그 (`docker compose logs -f backend`)
2. 완성된 글 결과물 화면 (Step 3 본문 편집 화면)
3. `.env` 파일 구조 (API 키 가린 상태로)
4. Upstage Console 가입 화면 또는 $10 크레딧 확인 화면
