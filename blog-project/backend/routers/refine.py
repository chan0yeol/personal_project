from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import anthropic
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class RefineRequest(BaseModel):
    title: str
    content: str   # 마크다운


class RefineResponse(BaseModel):
    title: str
    content: str


@router.post("/refine", response_model=RefineResponse)
async def refine_post(req: RefineRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY가 설정되지 않았습니다.")

    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"""아래 블로그 초안을 다듬어주세요.

제목: {req.title}

본문:
{req.content}

[다듬기 규칙]
- 한자, 일본어, 러시아어, 베트남어 등 외국어 문자를 자연스러운 한국어로 교체
- 어색한 문장을 자연스러운 한국어로 수정
- 내용과 구조(마크다운 헤딩, 섹션 순서)는 유지
- 전체 재작성 금지, 최소한의 수정만
- 각 섹션 분량 유지 (늘리거나 줄이지 말 것)

JSON으로만 응답:
{{"title": "제목", "content": "다듬어진 마크다운 본문"}}"""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}],
        )

        import json
        # JSON 블록 추출
        text = message.content[0].text
        json_match = __import__('re').search(r'\{.*\}', text, __import__('re').DOTALL)
        if not json_match:
            raise ValueError("JSON 파싱 실패")

        result = json.loads(json_match.group())
        logger.info(f"[Refine] 완료 — 입력 {message.usage.input_tokens}t / 출력 {message.usage.output_tokens}t")

        return RefineResponse(
            title=result.get("title", req.title),
            content=result.get("content", req.content),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude 다듬기 실패: {str(e)}")
