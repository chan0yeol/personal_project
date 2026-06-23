import json
import logging
import os
import re
from datetime import date, timedelta

from groq import Groq

logger = logging.getLogger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

PROMPT_TEMPLATE = """당신은 한국인 미국주식 투자자를 위한 유튜브 쇼츠 스크립트 작가입니다.
아래는 간밤 미국 증시 관련 영어 뉴스 목록입니다. 한국어로 번역하고 요약해서 스크립트를 작성하세요.

뉴스 목록:
{news_text}

⚠️ 핵심 규칙: 금액, 주가, 퍼센트 등 모든 수치는 반드시 원문 그대로 사용할 것. 절대 추측하거나 변경하지 말 것.

조건:
- 대상: 아침에 미국장 결과가 궁금한 한국 개인 투자자
- narration: 자연스러운 한국어, 반드시 50~60초 분량 (최소 300자)
  - 인트로: "안녕하세요! 간밤 미국 증시 주요 이슈 TOP5를 정리해드립니다."로 시작
  - 각 뉴스를 자연스럽게 연결하며 설명 (수치, 종목명 포함)
  - 아웃트로: "구독과 알림 설정으로 매일 아침 미국장 정리를 받아보세요!"로 마무리
- news_items: 가장 중요한 5개 선별
  - headline: 핵심 제목 한국어 (최대 18자, 종목명/지수 포함)
  - summary: 무슨 일이 있었는지, 왜 움직였는지, 수치는 얼마인지, 앞으로 어떻게 될지 맥락 포함 (120~160자). 수치는 원문 기준으로만 작성

아래 JSON 형식으로만 출력하세요. 다른 텍스트 없이:
{{
  "id": "{date_id}",
  "date": "{today}",
  "title": "간밤 미국장 TOP5 | {yesterday} 이슈 총정리",
  "narration": "나레이션 전체 텍스트 (300자 이상)",
  "news_items": [
    {{"headline": "제목 (최대 18자)", "summary": "무슨 일, 왜, 수치, 전망 포함 (120~160자)"}},
    {{"headline": "제목 (최대 18자)", "summary": "무슨 일, 왜, 수치, 전망 포함 (120~160자)"}},
    {{"headline": "제목 (최대 18자)", "summary": "무슨 일, 왜, 수치, 전망 포함 (120~160자)"}},
    {{"headline": "제목 (최대 18자)", "summary": "무슨 일, 왜, 수치, 전망 포함 (120~160자)"}},
    {{"headline": "제목 (최대 18자)", "summary": "무슨 일, 왜, 수치, 전망 포함 (120~160자)"}}
  ],
  "tags": ["미국주식", "미국장", "나스닥", "해외주식", "주식뉴스", "간밤미국장"],
  "thumbnail_text": "간밤\\n미국장 TOP5"
}}"""


def generate_script(articles: list[dict]) -> dict:
    today = date.today().strftime("%Y-%m-%d")
    yesterday = (date.today() - timedelta(days=1)).strftime("%m/%d")
    date_id = today.replace("-", "")

    news_text = "\n".join(
        f"{i+1}. {a['title']}" + (f"\n   {a['summary'][:500]}" if a.get("summary") else "")
        for i, a in enumerate(articles[:8])
    )

    prompt = PROMPT_TEMPLATE.format(
        news_text=news_text,
        date_id=date_id,
        today=today,
        yesterday=yesterday,
    )

    logger.info("Groq으로 미국장 스크립트 생성 중...")
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    raw = response.choices[0].message.content.strip()

    raw = re.sub(r"^```(?:json)?\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw)

    script = json.loads(raw.strip())
    logger.info(f"스크립트 생성 완료: {script['title']}")
    return script
