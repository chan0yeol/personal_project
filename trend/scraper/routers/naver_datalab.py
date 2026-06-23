from fastapi import APIRouter, HTTPException, Query
import httpx
from datetime import datetime, timedelta
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

DATALAB_URL = "https://openapi.naver.com/v1/datalab/search"


def get_headers() -> dict:
    client_id = os.getenv("NAVER_CLIENT_ID", "")
    client_secret = os.getenv("NAVER_CLIENT_SECRET", "")
    if not client_id or not client_secret:
        raise ValueError("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수가 설정되지 않았습니다.")
    return {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
        "Content-Type": "application/json",
    }


@router.post("/naver-datalab")
async def collect_naver_datalab(
    keywords: list[str] = Query(..., description="검색 키워드 목록 (최대 5개)"),
    start_date: str = Query(None, description="시작일 YYYY-MM-DD (기본: 90일 전)"),
    end_date: str = Query(None, description="종료일 YYYY-MM-DD (기본: 오늘)"),
    time_unit: str = Query("date", description="집계 단위: date / week / month"),
):
    """
    네이버 DataLab 검색어트렌드 API.
    키워드별 상대적 검색량(0~100)을 시계열로 반환.
    """
    if len(keywords) > 5:
        raise HTTPException(status_code=400, detail="키워드는 최대 5개까지 가능합니다.")

    try:
        headers = get_headers()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    today = datetime.today()
    end = end_date or today.strftime("%Y-%m-%d")
    start = start_date or (today - timedelta(days=90)).strftime("%Y-%m-%d")

    body = {
        "startDate": start,
        "endDate": end,
        "timeUnit": time_unit,
        "keywordGroups": [
            {"groupName": kw, "keywords": [kw]}
            for kw in keywords
        ],
        "device": "",
        "gender": "",
        "ages": [],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(DATALAB_URL, headers=headers, json=body)
            response.raise_for_status()

        raw = response.json()
        results = raw.get("results", [])

        # Google Trends와 동일한 구조로 변환
        # [{date, keyword1: score, keyword2: score, ...}]
        date_map: dict[str, dict] = {}
        for result in results:
            kw_name = result["title"]
            for point in result.get("data", []):
                date = point["period"]
                if date not in date_map:
                    date_map[date] = {"date": date}
                date_map[date][kw_name] = round(point["ratio"], 2)

        data = sorted(date_map.values(), key=lambda x: x["date"])

        return {
            "keywords": keywords,
            "data": data,
            "meta": {
                "start_date": start,
                "end_date": end,
                "time_unit": time_unit,
                "collected_at": datetime.utcnow().isoformat(),
                "data_points": len(data),
            },
        }

    except httpx.HTTPStatusError as e:
        logger.error(f"DataLab API 오류: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=502, detail=f"네이버 DataLab API 오류: {e.response.status_code}")
    except Exception as e:
        logger.error(f"DataLab 수집 실패: {e}")
        raise HTTPException(status_code=500, detail=f"수집 실패: {str(e)}")


@router.get("/naver-datalab/ranking")
async def collect_naver_datalab_ranking(
    keywords: list[str] = Query(..., description="비교할 키워드 목록 (최대 5개)"),
):
    """
    최근 7일 검색량 평균 기준으로 키워드 순위 반환.
    """
    if len(keywords) > 5:
        raise HTTPException(status_code=400, detail="키워드는 최대 5개까지 가능합니다.")

    try:
        headers = get_headers()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    today = datetime.today()
    end = today.strftime("%Y-%m-%d")
    start = (today - timedelta(days=7)).strftime("%Y-%m-%d")

    body = {
        "startDate": start,
        "endDate": end,
        "timeUnit": "date",
        "keywordGroups": [{"groupName": kw, "keywords": [kw]} for kw in keywords],
        "device": "",
        "gender": "",
        "ages": [],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(DATALAB_URL, headers=headers, json=body)
            response.raise_for_status()

        results = response.json().get("results", [])

        ranking = []
        for result in results:
            data_points = result.get("data", [])
            avg = sum(p["ratio"] for p in data_points) / len(data_points) if data_points else 0
            ranking.append({"keyword": result["title"], "avg_score": round(avg, 2)})

        ranking.sort(key=lambda x: x["avg_score"], reverse=True)
        for i, item in enumerate(ranking):
            item["rank"] = i + 1

        return {
            "keywords": keywords,
            "ranking": ranking,
            "period": f"{start} ~ {end}",
            "collected_at": datetime.utcnow().isoformat(),
        }

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"네이버 DataLab API 오류: {e.response.status_code}")
    except Exception as e:
        logger.error(f"DataLab 랭킹 수집 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))
