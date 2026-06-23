from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import httpx
import base64

router = APIRouter()


def get_wp_auth_header() -> str:
    user = os.getenv("WP_USER")
    password = os.getenv("WP_APP_PASSWORD")
    if not user or not password:
        raise HTTPException(
            status_code=500,
            detail="WP_USER or WP_APP_PASSWORD is not set",
        )
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return f"Basic {token}"


class WordPressPostRequest(BaseModel):
    title: str
    content: str  # HTML
    tags: Optional[list[str]] = []
    status: Optional[str] = "publish"  # publish or draft
    category_ids: Optional[list[int]] = []


class WordPressPostResponse(BaseModel):
    post_id: int
    url: str
    status: str


@router.post("/wordpress", response_model=WordPressPostResponse)
async def publish_to_wordpress(req: WordPressPostRequest):
    wp_url = os.getenv("WP_URL", "").rstrip("/")
    if not wp_url:
        raise HTTPException(status_code=500, detail="WP_URL is not set")

    headers = {
        "Authorization": get_wp_auth_header(),
        "Content-Type": "application/json",
    }

    # 태그 ID 조회 or 생성
    tag_ids = []
    if req.tags:
        tag_ids = await _get_or_create_tags(wp_url, headers, req.tags)

    payload = {
        "title": req.title,
        "content": req.content,
        "status": req.status,
        "tags": tag_ids,
    }
    if req.category_ids:
        payload["categories"] = req.category_ids

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{wp_url}/wp-json/wp/v2/posts",
            headers=headers,
            json=payload,
        )

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=response.status_code,
            detail=f"WordPress API error: {response.text}",
        )

    data = response.json()
    return WordPressPostResponse(
        post_id=data["id"],
        url=data["link"],
        status=data["status"],
    )


async def _get_or_create_tags(wp_url: str, headers: dict, tag_names: list[str]) -> list[int]:
    """태그 이름으로 ID를 조회하고, 없으면 생성합니다."""
    tag_ids = []
    async with httpx.AsyncClient(timeout=15) as client:
        for name in tag_names:
            # 검색
            search_resp = await client.get(
                f"{wp_url}/wp-json/wp/v2/tags",
                headers=headers,
                params={"search": name, "per_page": 1},
            )
            results = search_resp.json()
            if results and isinstance(results, list) and results[0].get("name") == name:
                tag_ids.append(results[0]["id"])
            else:
                # 생성
                create_resp = await client.post(
                    f"{wp_url}/wp-json/wp/v2/tags",
                    headers=headers,
                    json={"name": name},
                )
                if create_resp.status_code in (200, 201):
                    tag_ids.append(create_resp.json()["id"])
    return tag_ids
