from fastapi import APIRouter, HTTPException, Query, Body
import httpx
import os
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# 티스토리 API 설정
TISTORY_API_URL = "https://www.tistory.com/apis/post/write"
ACCESS_TOKEN = os.getenv("TISTORY_ACCESS_TOKEN")
BLOG_NAME = os.getenv("TISTORY_BLOG_NAME")

class TistoryPostRequest(BaseModel):
    title: str
    content: str
    category: Optional[int] = 0
    tag: Optional[str] = ""
    visibility: Optional[int] = 3 # 0: 비공개, 2: 보호, 3: 발행

@router.post("/publish/tistory")
async def publish_to_tistory(post: TistoryPostRequest):
    if not ACCESS_TOKEN or not BLOG_NAME:
        raise HTTPException(status_code=500, detail="TISTORY_ACCESS_TOKEN or TISTORY_BLOG_NAME is not set in .env")

    params = {
        "access_token": ACCESS_TOKEN,
        "output": "json",
        "blogName": BLOG_NAME,
        "title": post.title,
        "content": post.content,
        "visibility": post.visibility,
        "category": post.category,
        "tag": post.tag,
        "acceptComment": 1
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(TISTORY_API_URL, data=params)
            result = response.json()
            
            if result.get("tistory", {}).get("status") == "200":
                post_id = result["tistory"].get("postId")
                url = result["tistory"].get("url")
                return {"status": "success", "postId": post_id, "url": url}
            else:
                error_msg = result.get("tistory", {}).get("error_message", "Unknown error")
                raise HTTPException(status_code=500, detail=f"Tistory API Error: {error_msg}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/publish/tistory/categories")
async def get_tistory_categories():
    url = "https://www.tistory.com/apis/category/list"
    params = {
        "access_token": ACCESS_TOKEN,
        "output": "json",
        "blogName": BLOG_NAME
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()