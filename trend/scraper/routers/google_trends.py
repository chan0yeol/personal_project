from fastapi import APIRouter, HTTPException, Query
from pytrends.request import TrendReq
import pandas as pd
from datetime import datetime, timedelta
import logging
import time
import httpx
from xml.etree import ElementTree as ET

router = APIRouter()
logger = logging.getLogger(__name__)


def get_pytrends_client() -> TrendReq:
    return TrendReq(hl="ko", tz=540, timeout=(10, 30), retries=2, backoff_factor=0.5)


@router.get("/google")
async def collect_google_trends(
    keywords: list[str] = Query(..., description="검색 키워드 목록 (최대 5개)"),
    timeframe: str = Query("today 3-m", description="기간 (예: today 3-m, today 12-m, now 7-d)"),
    geo: str = Query("KR", description="지역 코드"),
    limit: int = Query(100, ge=1, le=500, description="최대 데이터 포인트 수"),
):
    """
    Google Trends 키워드 관심도 데이터 수집.
    반환값: 0~100 기준 상대적 관심도 시계열 데이터 (최대 100개 포인트)
    """
    if len(keywords) > 5:
        raise HTTPException(status_code=400, detail="키워드는 최대 5개까지 가능합니다.")

    try:
        pytrends = get_pytrends_client()
        pytrends.build_payload(keywords, cat=0, timeframe=timeframe, geo=geo)
        time.sleep(1)  # rate limit 방지

        interest_df = pytrends.interest_over_time()

        if interest_df.empty:
            return {"keywords": keywords, "data": [], "meta": {"timeframe": timeframe, "geo": geo}}

        # isPartial 컬럼 제거
        if "isPartial" in interest_df.columns:
            interest_df = interest_df.drop(columns=["isPartial"])

        interest_df = interest_df.reset_index()
        interest_df["date"] = interest_df["date"].dt.strftime("%Y-%m-%d")

        # 최신 데이터 기준 limit개 반환
        interest_df = interest_df.tail(limit)

        result = []
        for _, row in interest_df.iterrows():
            entry = {"date": row["date"]}
            for kw in keywords:
                if kw in row:
                    entry[kw] = int(row[kw])
            result.append(entry)

        return {
            "keywords": keywords,
            "data": result,
            "meta": {
                "timeframe": timeframe,
                "geo": geo,
                "collected_at": datetime.utcnow().isoformat(),
                "data_points": len(result),
            },
        }

    except Exception as e:
        logger.error(f"Google Trends 수집 실패: {e}")
        raise HTTPException(status_code=500, detail=f"데이터 수집 실패: {str(e)}")


@router.get("/google/realtime")
async def collect_google_realtime(geo: str = Query("KR", description="지역 코드")):
    """
    Google Trends 실시간 인기 검색어 수집.
    RSS 피드 → realtime_trending_searches → today_searches 순으로 fallback.
    """
    trending_list = []

    # 1차 시도: Google Trends RSS 피드 (API 인증 불필요, 가장 안정적)
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            r = await client.get(
                f"https://trends.google.com/trending/rss?geo={geo}",
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
            )
            r.raise_for_status()
        root = ET.fromstring(r.text)
        items = root.findall(".//item")
        for rank, item in enumerate(items[:20], start=1):
            title = item.findtext("title", "").strip()
            if title:
                trending_list.append({"rank": rank, "keyword": title})
        if trending_list:
            logger.info(f"[Realtime] RSS 피드 수집 완료: {len(trending_list)}개")
    except Exception as e_rss:
        logger.warning(f"RSS 피드 실패: {e_rss}")

    # 2차 fallback: pytrends realtime_trending_searches
    if not trending_list:
        try:
            pytrends = get_pytrends_client()
            df = pytrends.realtime_trending_searches(pn=geo)
            if df is not None and not df.empty:
                title_col = "title" if "title" in df.columns else df.columns[0]
                for rank, row in enumerate(df[title_col].tolist()[:20], start=1):
                    trending_list.append({"rank": rank, "keyword": str(row)})
                logger.info(f"[Realtime] pytrends realtime 수집 완료: {len(trending_list)}개")
        except Exception as e1:
            logger.warning(f"realtime_trending_searches 실패: {e1}")

    # 3차 fallback: pytrends today_searches
    if not trending_list:
        try:
            pytrends = get_pytrends_client()
            df2 = pytrends.today_searches(pn=geo)
            if df2 is not None and not df2.empty:
                col = df2.columns[0] if hasattr(df2, "columns") else 0
                for rank, keyword in enumerate(df2[col].tolist()[:20], start=1):
                    trending_list.append({"rank": rank, "keyword": str(keyword)})
                logger.info(f"[Realtime] pytrends today 수집 완료: {len(trending_list)}개")
        except Exception as e2:
            logger.warning(f"today_searches 실패: {e2}")

    try:
        return {
            "geo": geo,
            "trending": trending_list,
            "collected_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Google 실시간 트렌드 수집 실패: {e}")
        raise HTTPException(status_code=500, detail=f"실시간 트렌드 수집 실패: {str(e)}")


@router.get("/google/related")
async def collect_related_queries(
    keyword: str = Query(..., description="기준 키워드"),
    geo: str = Query("KR", description="지역 코드"),
):
    """
    특정 키워드의 연관 검색어 수집.
    """
    try:
        pytrends = get_pytrends_client()
        pytrends.build_payload([keyword], cat=0, timeframe="today 3-m", geo=geo)
        time.sleep(1)

        related = pytrends.related_queries()
        keyword_data = related.get(keyword, {})

        top_queries = []
        rising_queries = []

        if keyword_data.get("top") is not None and not keyword_data["top"].empty:
            top_queries = keyword_data["top"].head(10).to_dict(orient="records")

        if keyword_data.get("rising") is not None and not keyword_data["rising"].empty:
            rising_queries = keyword_data["rising"].head(10).to_dict(orient="records")

        return {
            "keyword": keyword,
            "top_queries": top_queries,
            "rising_queries": rising_queries,
            "collected_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"연관 검색어 수집 실패: {e}")
        raise HTTPException(status_code=500, detail=f"연관 검색어 수집 실패: {str(e)}")


def _geo_to_country(geo: str) -> str:
    mapping = {"KR": "south_korea", "US": "united_states", "JP": "japan"}
    return mapping.get(geo, "south_korea")
