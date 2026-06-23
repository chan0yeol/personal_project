from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from groq import Groq

router = APIRouter()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


class GenerateRequest(BaseModel):
    keyword: str
    language: Optional[str] = "ko"
    tone: Optional[str] = "informative"  # informative, casual, professional
    min_length: Optional[int] = 2000


class GenerateResponse(BaseModel):
    title: str
    content: str  # HTML 형식
    tags: list[str]
    keyword: str


@router.post("/groq", response_model=GenerateResponse)
async def generate_post(req: GenerateRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not set")

    tone_map = {
        "informative": "정보 전달 위주의 객관적인",
        "casual": "친근하고 읽기 쉬운",
        "professional": "전문적이고 신뢰감 있는",
    }
    tone_desc = tone_map.get(req.tone, "정보 전달 위주의 객관적인")

    system_prompt = (
        "당신은 SEO에 최적화된 블로그 포스트를 작성하는 전문 작가입니다. "
        "HTML 형식으로 본문을 작성하되, <h2>, <h3>, <p>, <ul>, <li>, <strong> 태그를 적절히 사용하세요. "
        "마크다운을 사용하지 말고 순수 HTML만 사용하세요."
    )

    user_prompt = f"""다음 키워드로 블로그 포스트를 작성해주세요.

키워드: {req.keyword}
언어: {req.language}
톤: {tone_desc} 스타일
최소 길이: {req.min_length}자 이상

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{{
  "title": "SEO에 최적화된 제목",
  "content": "<h2>섹션1</h2><p>내용...</p>...",
  "tags": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}}"""

    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=4096,
            response_format={"type": "json_object"},
        )

        import json
        result = json.loads(response.choices[0].message.content)

        return GenerateResponse(
            title=result["title"],
            content=result["content"],
            tags=result.get("tags", []),
            keyword=req.keyword,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")
