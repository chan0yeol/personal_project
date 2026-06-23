from fastapi import APIRouter, HTTPException, Query
import httpx
from datetime import datetime
import logging
import asyncio
import os

router = APIRouter()
logger = logging.getLogger(__name__)

NAVER_NEWS_API_URL = "https://openapi.naver.com/v1/search/news.json"


def get_naver_headers() -> dict:
    client_id = os.getenv("NAVER_CLIENT_ID", "")
    client_secret = os.getenv("NAVER_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        raise ValueError("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.")
    return {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }


@router.get("/naver-news")
async def collect_naver_news(
    keyword: str = Query(..., description="검색 키워드"),
    max_articles: int = Query(20, ge=1, le=100, description="수집할 기사 수"),
):
    """
    네이버 공식 검색 API로 키워드 관련 최신 뉴스 수집.
    """
    try:
        headers = get_naver_headers()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        params = {
            "query": keyword,
            "display": min(max_articles, 100),
            "sort": "date",  # 최신순
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(NAVER_NEWS_API_URL, headers=headers, params=params)
            response.raise_for_status()

        data = response.json()
        items = data.get("items", [])

        articles = [
            {
                "title": _strip_tags(item.get("title", "")),
                "link": item.get("originallink") or item.get("link", ""),
                "description": _strip_tags(item.get("description", ""))[:200],
                "press": _extract_press(item.get("originallink", "")),
                "published_at": item.get("pubDate", ""),
            }
            for item in items
        ]

        sentiment = _analyze_sentiment_simple(articles)

        return {
            "keyword": keyword,
            "total_count": len(articles),
            "articles": articles,
            "sentiment": sentiment,
            "collected_at": datetime.utcnow().isoformat(),
        }

    except httpx.HTTPStatusError as e:
        logger.error(f"네이버 API HTTP 오류 [{keyword}]: {e.response.status_code}")
        raise HTTPException(status_code=502, detail=f"네이버 API 오류: {e.response.status_code}")
    except Exception as e:
        logger.error(f"네이버 뉴스 수집 실패 [{keyword}]: {e}")
        raise HTTPException(status_code=500, detail=f"뉴스 수집 실패: {str(e)}")


@router.get("/naver-news/batch")
async def collect_naver_news_batch(
    keywords: list[str] = Query(..., description="키워드 목록 (최대 10개)"),
    max_per_keyword: int = Query(10, ge=1, le=50),
):
    """
    여러 키워드 동시 뉴스 수집.
    """
    if len(keywords) > 10:
        raise HTTPException(status_code=400, detail="키워드는 최대 10개까지 가능합니다.")

    tasks = [_collect_single(kw, max_per_keyword) for kw in keywords]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    output = {}
    for kw, result in zip(keywords, results):
        if isinstance(result, Exception):
            output[kw] = {"error": str(result), "articles": [], "total_count": 0}
        else:
            output[kw] = result

    return {"results": output, "collected_at": datetime.utcnow().isoformat()}


async def _collect_single(keyword: str, max_articles: int) -> dict:
    headers = get_naver_headers()
    params = {"query": keyword, "display": min(max_articles, 100), "sort": "date"}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(NAVER_NEWS_API_URL, headers=headers, params=params)
        response.raise_for_status()

    items = response.json().get("items", [])
    articles = [
        {
            "title": _strip_tags(item.get("title", "")),
            "link": item.get("originallink") or item.get("link", ""),
            "description": _strip_tags(item.get("description", ""))[:200],
            "press": _extract_press(item.get("originallink", "")),
            "published_at": item.get("pubDate", ""),
        }
        for item in items
    ]
    return {
        "keyword": keyword,
        "total_count": len(articles),
        "articles": articles,
        "sentiment": _analyze_sentiment_simple(articles),
    }


# ─── 유틸 ────────────────────────────────────────────────────────────────────

def _strip_tags(text: str) -> str:
    """네이버 API 응답의 HTML 태그 제거."""
    import re
    return re.sub(r"<[^>]+>", "", text).replace("&quot;", '"').replace("&amp;", "&").strip()


def _extract_press(url: str) -> str:
    """URL에서 언론사 도메인 추출."""
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        return domain.replace("www.", "").split(".")[0]
    except Exception:
        return "알 수 없음"


def _analyze_sentiment_simple(articles: list[dict]) -> dict:
    positive_words = ["성장", "상승", "호조", "개선", "증가", "돌파", "호실적", "흑자", "성공", "혁신"]
    negative_words = ["하락", "감소", "위기", "적자", "폭락", "부진", "실패", "손실", "우려", "논란"]

    pos, neg = 0, 0
    for a in articles:
        text = a.get("title", "") + " " + a.get("description", "")
        pos += sum(1 for w in positive_words if w in text)
        neg += sum(1 for w in negative_words if w in text)

    total = pos + neg
    if total == 0:
        return {"sentiment": "neutral", "score": 0.5, "positive_count": 0, "negative_count": 0}

    if pos > neg:
        return {"sentiment": "positive", "score": round(pos / total, 2), "positive_count": pos, "negative_count": neg}
    return {"sentiment": "negative", "score": round(neg / total, 2), "positive_count": pos, "negative_count": neg}
