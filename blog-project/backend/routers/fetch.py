from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bs4 import BeautifulSoup
import httpx
import re

router = APIRouter()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}


class FetchRequest(BaseModel):
    urls: list[str]


class FetchedContent(BaseModel):
    url: str
    title: str
    content: str
    success: bool
    error: str | None = None


@router.post("/fetch", response_model=list[FetchedContent])
async def fetch_urls(req: FetchRequest):
    if len(req.urls) > 10:
        raise HTTPException(status_code=400, detail="URL은 최대 10개까지 가능합니다.")

    results = []
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for url in req.urls:
            try:
                resp = await client.get(url.strip(), headers=HEADERS)
                resp.raise_for_status()
                title, content = _extract(resp.text)
                results.append(FetchedContent(url=url, title=title, content=content, success=True))
            except Exception as e:
                results.append(FetchedContent(url=url, title="", content="", success=False, error=str(e)))

    return results


def _extract(html: str) -> tuple[str, str]:
    soup = BeautifulSoup(html, "lxml")

    # 불필요한 태그 제거
    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "iframe", "noscript"]):
        tag.decompose()

    title = ""
    if soup.title:
        title = soup.title.get_text(strip=True)
    if not title:
        og_title = soup.find("meta", property="og:title")
        if og_title:
            title = og_title.get("content", "")

    # 본문 추출 우선순위
    content = ""
    for selector in ["article", "main", ".content", ".post-content", "#content", ".article-body"]:
        el = soup.select_one(selector)
        if el:
            content = el.get_text(separator="\n", strip=True)
            break

    if not content:
        body = soup.find("body")
        if body:
            content = body.get_text(separator="\n", strip=True)

    # 연속 공백/빈줄 정리
    content = re.sub(r"\n{3,}", "\n\n", content).strip()

    return title, content[:5000]  # 최대 5000자
