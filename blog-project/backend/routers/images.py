from fastapi import APIRouter, HTTPException, Query
import httpx
import os

router = APIRouter()

PIXABAY_URL = "https://pixabay.com/api/"


class ImageItem:
    def __init__(self, data: dict):
        self.id = data["id"]
        self.preview = data["webformatURL"]
        self.full = data["largeImageURL"]
        self.thumb = data["previewURL"]
        self.tags = data.get("tags", "")
        self.user = data.get("user", "")
        self.downloads = data.get("downloads", 0)


@router.get("/images")
async def search_images(
    keyword: str = Query(..., description="검색 키워드"),
    count: int = Query(12, ge=1, le=30),
    image_type: str = Query("photo", description="photo | illustration | vector"),
):
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="PIXABAY_API_KEY is not set")

    params = {
        "key": api_key,
        "q": keyword,
        "image_type": image_type,
        "per_page": count,
        "safesearch": "true",
        "lang": "ko",
        "order": "popular",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(PIXABAY_URL, params=params)
            resp.raise_for_status()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Pixabay 오류: {str(e)}")

    hits = resp.json().get("hits", [])
    return {
        "keyword": keyword,
        "total": len(hits),
        "images": [
            {
                "id": h["id"],
                "preview": h["webformatURL"],
                "full": h["largeImageURL"],
                "thumb": h["previewURL"],
                "tags": h.get("tags", ""),
                "user": h.get("user", ""),
            }
            for h in hits
        ],
    }
