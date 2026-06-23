from fastapi import APIRouter, HTTPException
from bs4 import BeautifulSoup
import httpx
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Referer": "https://datalab.naver.com/",
    "Accept-Language": "ko-KR,ko;q=0.9",
}


@router.get("/naver-realtime")
async def collect_naver_realtime():
    """
    네이버 DataLab 급상승 검색어 수집.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(
                "https://datalab.naver.com/keyword/realtimeList.naver",
                headers=HEADERS,
            )
            response.raise_for_status()

        trending = _parse_realtime_list(response.text)

        if not trending:
            raise HTTPException(status_code=502, detail="키워드 파싱 실패 — 페이지 구조가 변경되었을 수 있습니다.")

        return {
            "trending": trending,
            "total": len(trending),
            "collected_at": datetime.utcnow().isoformat(),
            "source": "naver_datalab",
        }

    except httpx.HTTPStatusError as e:
        logger.error(f"Naver realtime HTTP error: {e.response.status_code}")
        raise HTTPException(status_code=502, detail=f"네이버 요청 실패: {e.response.status_code}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Naver realtime scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _parse_realtime_list(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    results = []

    # 구조 1: .item_title (현재 DataLab 구조)
    for item in soup.select("li.item"):
        rank_el = item.select_one(".rank, .num")
        keyword_el = item.select_one(".keyword, .item_title, .tit")
        if not keyword_el:
            continue
        rank = int(rank_el.get_text(strip=True)) if rank_el else len(results) + 1
        keyword = keyword_el.get_text(strip=True)
        if keyword:
            results.append({"rank": rank, "keyword": keyword})

    # 구조 2: 테이블 형식 fallback
    if not results:
        for i, row in enumerate(soup.select("tr.item, .keyword_rank li"), start=1):
            text = row.get_text(strip=True)
            if text:
                results.append({"rank": i, "keyword": text[:50]})

    return results[:20]
