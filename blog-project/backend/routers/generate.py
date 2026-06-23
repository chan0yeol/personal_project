from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
from google import genai
from google.genai import types
from openai import OpenAI
import os
import json
import re
import random
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── 외국어 감지 ─────────────────────────────────────────────────────────────

def _has_foreign_chars(text: str) -> bool:
    foreign = re.findall(
        r'[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F'
        r'a-zA-Z0-9'
        r'\s\.,!?;:\'\"()\[\]{}\-\_\*\#\/\\\n\r\t'
        r'\u00B7\u2019\u201C\u201D\u2013\u2014'
        r'\u00B5\u03BC'        # μ (마이크로그램 단위)
        r'\u00AE\u2122'        # ® ™
        r'\u00B0'              # °
        r'\u2030'              # ‰
        r'\u00D7\u00F7'        # × ÷
        r'\u2265\u2264\u2260'  # ≥ ≤ ≠
        r'\u25B6\u25CF\u2022'  # ▶ ● •
        r']',
        text
    )
    return len(foreign) > 10


# ─── Models ──────────────────────────────────────────────────────────────────

class SuggestRequest(BaseModel):
    keyword: str


class OutlineSection(BaseModel):
    title: str
    points: list[str]


class OutlineRequest(BaseModel):
    keyword: str
    sub_keywords: list[str] = []
    references: list[str] = []
    tone: str = "informative"


class OutlineResponse(BaseModel):
    title_candidates: list[str]
    sections: list[OutlineSection]
    tags: list[str]
    meta_description: str


class GenerateRequest(BaseModel):
    keyword: str
    title: str
    sections: list[OutlineSection]
    tags: list[str] = []
    meta_description: str = ""
    references: list[str] = []
    tone: str = "informative"


class GenerateResponse(BaseModel):
    title: str
    content: str
    tags: list[str]
    meta_description: str
    provider: str = ""  # gemini | groq


# ─── AI 호출 (Gemini → Groq 폴백) ────────────────────────────────────────────

SYSTEM_PROMPT = (
    "당신은 건강·영양 정보에 정통한 한국어 블로그 전문 작가입니다. "
    "구글 SEO와 애드센스 승인 기준에 맞는 고품질 건강 정보 글을 씁니다. "
    "글쓰기 원칙: 구체적인 수치(mg, IU, %, 권장량)와 실생활 예시를 반드시 포함합니다. "
    "독자가 읽고 바로 실천할 수 있는 실용적인 정보를 제공합니다. "
    "절대 규칙: 한국어와 기본 영숫자(브랜드명, 수치 단위 등)만 사용하세요. "
    "한자, 일본어, 러시아어, 베트남어, 아랍어 등 다른 언어 문자를 단 한 글자도 출력하지 마세요. "
    "JSON 형식 외에 다른 텍스트를 출력하지 마세요."
)

# 외부 링크로 사용할 공신력 있는 한국 건강 기관
AUTHORITATIVE_SOURCES = [
    ("식품의약품안전처", "https://www.mfds.go.kr"),
    ("보건복지부", "https://www.mohw.go.kr"),
    ("국민건강보험공단", "https://www.nhis.or.kr"),
    ("한국영양학회", "https://www.kns.or.kr"),
    ("질병관리청", "https://www.kdca.go.kr"),
]


def _call_gemini(prompt: str, temperature: float = 0.6) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)
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


def _call_solar(prompt: str, temperature: float = 0.6) -> dict:
    api_key = os.getenv("UPSTAGE_API_KEY")
    if not api_key:
        raise ValueError("UPSTAGE_API_KEY not set")

    client = OpenAI(api_key=api_key, base_url="https://api.upstage.ai/v1")
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


def _call_groq(prompt: str, temperature: float = 0.6) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _generate_with_fallback(prompt: str) -> tuple[dict, str]:
    """Solar 먼저 시도, 실패 시 Gemini → Groq 폴백. (result, provider) 반환"""
    last_result: tuple[dict, str] | None = None

    for attempt in range(1):
        temperature = 0.6 if attempt == 0 else 0.4

        # 1. Solar 우선 (한국어 특화)
        if os.getenv("UPSTAGE_API_KEY"):
            try:
                result = _call_solar(prompt, temperature)
                logger.info(f"[Generate] Solar 성공 (시도 {attempt+1})")
                return result, "solar"
            except Exception as e:
                logger.warning(f"[Generate] Solar 실패: {e}")

        # 2. Gemini 폴백
        if os.getenv("GEMINI_API_KEY"):
            try:
                result = _call_gemini(prompt, temperature)
                if not _has_foreign_chars(result.get("content", result.get("meta_description", ""))):
                    logger.info(f"[Generate] Gemini 성공 (시도 {attempt+1})")
                    return result, "gemini"
                logger.warning("[Generate] Gemini — 외국어 감지, 다음 모델로")
                last_result = (result, "gemini")
            except Exception as e:
                logger.warning(f"[Generate] Gemini 실패: {e}")

        # 3. Groq 폴백
        if os.getenv("GROQ_API_KEY"):
            try:
                result = _call_groq(prompt, temperature)
                if not _has_foreign_chars(result.get("content", result.get("meta_description", ""))):
                    logger.info(f"[Generate] Groq 성공 (시도 {attempt+1})")
                    return result, "groq"
                logger.warning("[Generate] Groq — 외국어 감지, 마지막 후보로 저장")
                last_result = (result, "groq")
            except Exception as e:
                logger.warning(f"[Generate] Groq 실패: {e}")

    if last_result:
        logger.warning("[Generate] 외국어 감지 결과를 최후 사용 (last_result fallback)")
        return last_result

    raise HTTPException(status_code=500, detail="Solar/Gemini/Groq 모두 생성 실패")


# ─── 메인 키워드 자동 추천 (Groq 전용) ───────────────────────────────────────

@router.post("/suggest-main-keyword")
async def suggest_main_keyword():
    """건강·영양제 분야의 SEO 친화적 메인 키워드 1개를 Groq로 추천"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY가 설정되지 않았습니다.")

    # 다양성을 위해 카테고리 랜덤 선택
    categories = [
        "특정 영양 성분(비타민/미네랄/오메가/유산균 등)",
        "특정 증상 개선(피로/수면/면역/관절/장 건강 등)",
        "연령대/성별별 영양제(20대/50대/남성/여성/임산부 등)",
        "건강기능식품 비교 또는 추천",
        "음식·식단을 통한 영양 보충",
        "최근 트렌드 건강 키워드(MZ 건강/저속노화/멘탈케어 등)",
    ]
    seed_category = random.choice(categories)
    seed_token = random.randint(1000, 9999)  # 캐시 회피용

    prompt = (
        f"한국어 건강·영양 블로그용 SEO 메인 키워드 1개를 추천하세요.\n\n"
        f"[조건]\n"
        f"- 카테고리: {seed_category}\n"
        f"- 길이: 2~4단어 (롱테일 선호, 너무 광범위한 단일어 금지)\n"
        f"- 한국 사용자가 네이버/구글에 실제 검색할 만한 자연스러운 표현\n"
        f"- 구매 의도(영양제 추천/효능/복용법/부작용)가 담긴 키워드 우대\n"
        f"- 의학적 치료 표현, 특정 브랜드명 금지\n"
        f"- 너무 진부한 키워드(비타민C, 종합비타민) 지양, 신선한 조합 선호\n"
        f"- 한국어만 사용\n"
        f"- 시드: {seed_token}\n\n"
        f'JSON: {{"keyword": "추천 키워드", "reason": "선정 이유 한 줄"}}'
    )

    try:
        client = Groq(api_key=api_key)
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=1.0,
            max_tokens=512,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)
        return {
            "keyword": result.get("keyword", "").strip(),
            "reason": result.get("reason", "").strip(),
            "category": seed_category,
            "provider": "groq",
        }
    except Exception as e:
        logger.error(f"[SuggestMain] 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── 서브키워드 추천 ──────────────────────────────────────────────────────────

@router.post("/suggest-keywords")
async def suggest_keywords(req: SuggestRequest):
    prompt = (
        f"건강·영양 블로그의 메인 키워드 '{req.keyword}'에 대해 "
        f"실제 독자가 검색할 만한 SEO 롱테일 서브키워드 5개를 추천해주세요. "
        f"효능, 복용법, 부작용, 추천 대상, 음식 등 다양한 각도로 구성하세요. "
        f"한국어로만 작성하세요.\n\n"
        f'JSON: {{"sub_keywords": ["서브키워드1", "서브키워드2", "서브키워드3", "서브키워드4", "서브키워드5"]}}'
    )
    try:
        result, provider = _generate_with_fallback(prompt)
        return {"keyword": req.keyword, "sub_keywords": result.get("sub_keywords", []), "provider": provider}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 개요 생성 ────────────────────────────────────────────────────────────────

@router.post("/outline", response_model=OutlineResponse)
async def generate_outline(req: OutlineRequest):
    tone_map = {
        "informative": "정보 전달 위주의 객관적인",
        "casual": "친근하고 읽기 쉬운",
        "professional": "전문적이고 신뢰감 있는",
    }
    tone_desc = tone_map.get(req.tone, "정보 전달 위주의 객관적인")

    ref_block = ""
    if req.references:
        combined = "\n\n---\n\n".join(req.references[:3])
        ref_block = f"\n\n[참고 자료 요약]\n{combined[:3000]}"

    sections_hint = ""
    if req.sub_keywords:
        kw_list = "\n".join([f"- {kw}" for kw in req.sub_keywords])
        sections_hint = f"\n\n[섹션 힌트 — 아래 서브키워드를 섹션 제목으로 활용]\n{kw_list}"

    prompt = f"""건강·영양 블로그 포스트 개요를 작성하세요.

메인 키워드: {req.keyword}
톤: {tone_desc}{sections_hint}{ref_block}

[규칙]
- 제목 후보 3개 (30자 이내, 메인 키워드 포함, 숫자나 효과를 넣어 클릭 유도)
  예) "마그네슘 효능 7가지와 올바른 복용법", "비타민D 결핍 증상과 하루 권장량 총정리"
- 섹션 구성: 도입부 + 효능/특징 + 복용법 또는 섭취방법 + 부작용/주의사항 + 추천 대상 + 마치며 (총 5~6개)
- 각 섹션마다 핵심 포인트 2~3개 (구체적 수치나 예시 포함)
- 마지막 섹션은 반드시 "마치며" 또는 "정리"
- 태그 5개 (메인 키워드 포함, 관련 성분명/증상명 포함)
- 메타 설명 120~160자 (반드시 메인 키워드로 시작하거나 첫 문장에 포함, 핵심 정보 포함)
- 한국어만 사용

JSON으로만 응답:
{{
  "title_candidates": ["제목1", "제목2", "제목3"],
  "sections": [
    {{"title": "도입부 섹션 제목", "points": ["핵심포인트1", "핵심포인트2"]}},
    {{"title": "섹션2 제목", "points": ["핵심포인트1", "핵심포인트2"]}}
  ],
  "tags": ["{req.keyword}", "태그2", "태그3", "태그4", "태그5"],
  "meta_description": "120~160자 메타 설명"
}}"""

    result, provider = _generate_with_fallback(prompt)
    logger.info(f"[Outline] 완료 — provider: {provider}")

    sections = [
        OutlineSection(title=s["title"], points=s.get("points", []))
        for s in result.get("sections", [])
    ]
    return OutlineResponse(
        title_candidates=result.get("title_candidates", []),
        sections=sections,
        tags=result.get("tags", [req.keyword]),
        meta_description=result.get("meta_description", ""),
    )


# ─── 본문 생성 (개요 기반) ────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateResponse)
async def generate_post(req: GenerateRequest):
    tone_map = {
        "informative": "정보 전달 위주의 객관적인",
        "casual": "친근하고 읽기 쉬운",
        "professional": "전문적이고 신뢰감 있는",
    }
    tone_desc = tone_map.get(req.tone, "정보 전달 위주의 객관적인")

    ref_block = ""
    if req.references:
        combined = "\n\n---\n\n".join(req.references[:5])
        ref_block = f"\n\n[참고 자료]\n{combined[:6000]}"

    # 섹션 구조를 프롬프트에 명시
    sections_block = "\n".join([
        f"{i+1}. ## {s.title}\n   - {chr(10).join(['   - ' + p for p in s.points])}"
        for i, s in enumerate(req.sections)
    ])

    content_example = "\\n\\n".join([f"## {s.title}\\n\\n내용..." for s in req.sections])

    ext_link1, ext_link2 = random.sample(AUTHORITATIVE_SOURCES, 2)
    wp_base = os.getenv("WP_URL", "").rstrip("/")
    # 내부 링크: 실제 도메인의 검색 URL 형태로 생성 (RankMath가 same-domain 링크만 인정)
    internal_link1 = f"{wp_base}/?s={req.tags[1] if len(req.tags) > 1 else req.keyword}" if wp_base else ""
    internal_link2 = f"{wp_base}/?s={req.tags[2] if len(req.tags) > 2 else req.keyword}+효능" if wp_base else ""
    internal_links_block = ""
    if internal_link1:
        internal_links_block = (
            f"5. 내부 링크 2개를 본문 중간에 마크다운으로 반드시 삽입 (RankMath 필수 항목):\n"
            f"   - [관련 정보 더 보기]({internal_link1}) — 두 번째 섹션 근처\n"
            f"   - [함께 읽으면 좋은 글]({internal_link2}) — 네 번째 섹션 근처"
        )

    prompt = f"""다음 개요를 따라 건강·영양 블로그 포스트 본문을 작성하세요. RankMath SEO 그린(80점 이상) + 구글 애드센스 승인 기준 + 독자 만족도를 동시에 충족해야 합니다.

제목: {req.title}
메인 키워드(Focus Keyword): {req.keyword}
톤: {tone_desc}

[개요 — 이 구조를 그대로 따르세요]
{sections_block}
{ref_block}

[RankMath SEO 그린 필수 규칙 — 아래를 어기면 점수 빨간색]
1. 도입부 첫 문장에 반드시 "{req.keyword}"를 그대로 포함 (변형 금지).
2. H2 소제목 중 최소 2개에 "{req.keyword}" 또는 핵심 단어를 포함.
3. 전체 본문에서 "{req.keyword}"가 정확히 8~12회 등장해야 함 (밀도 1~1.5%).
4. 외부 링크는 본문 중간(2~3번째 H2 섹션 내)에 마크다운으로 삽입:
   - [{ext_link1[0]}]({ext_link1[1]})
   - [{ext_link2[0]}]({ext_link2[1]})
{internal_links_block}
6. 메타 설명은 "{req.keyword}"로 시작, 140~155자, CTA(알아보세요/확인하세요) 포함.
7. 본문 첫 100자 내에 키워드 등장 + 독자의 검색 의도(왜 검색했는지) 언급.

[글 퀄리티 — 독자 만족도]
- 전체 분량: 한국어 기준 공백 포함 최소 7000자 (2000단어 이상) — 이보다 짧으면 실패로 간주
- 각 섹션 최소 200단어, 구체적 수치(mg, IU, %, 권장량) 2개 이상 포함
- 도입부(200자+): 독자가 공감할 수 있는 일상 시나리오로 시작 → 키워드 자연 도입 → 글에서 얻을 수 있는 3가지 명시
- 효능/특징 섹션: **굵은 부제목** 형식으로 3~5개 효과 나열, 각 항목마다 작용 원리 + 실생활 예시
- 복용법 섹션: 하루 권장량(연령대별 표 형식), 복용 시간(아침/식후/취침전), 흡수율 높이는 음식/영양소 조합, 흡수 방해 요소
- 부작용 섹션: 과다복용 증상, 약물 상호작용, 피해야 할 대상(임산부/특정 질환자), 안전 상한선
- FAQ 섹션 1개 추가: 독자가 자주 검색하는 질문 3개 + 답변 (각 2~3문장)
- 마치며: 핵심 3줄 요약 + "개인 건강 상태에 따라 전문가 상담을 권장합니다" 문구

[가독성 — RankMath Readability]
- 한 문장 20단어 이내 (긴 문장 금지)
- 한 문단 3~4문장 이내 (긴 문단 금지)
- 마크다운 활용: ## H2, ### H3, **굵게**, *기울임*, - 목록, 1. 번호목록, > 인용
- 표(table) 1개 이상 활용 (권장량/비교/연령별 등)

[금지 사항]
- 한국어만 사용 (한자/일본어/러시아어 등 단 한 글자도 금지)
- 특정 제품/브랜드 추천 금지
- 의학적 치료/완치/진단 표현 금지 → "도움을 줄 수 있습니다", "알려져 있습니다"
- 개요 섹션 추가/순서 변경 금지
- 광고성 표현, 과장 표현, 단정적 효과 표현 금지

JSON으로만 응답 (content는 마크다운 문자열):
{{
  "title": "{req.title}",
  "content": "{content_example}",
  "tags": {json.dumps(req.tags, ensure_ascii=False)},
  "meta_description": "{req.meta_description}"
}}"""

    result, provider = _generate_with_fallback(prompt)
    return GenerateResponse(
        title=result.get("title", req.title),
        content=result.get("content", ""),
        tags=result.get("tags", req.tags),
        meta_description=result.get("meta_description", req.meta_description),
        provider=provider,
    )
