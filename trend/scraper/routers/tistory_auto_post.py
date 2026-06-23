from fastapi import APIRouter, HTTPException, Body
from playwright.async_api import async_playwright
import os
import asyncio
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# 저장된 로그인 상태 파일 (한 번 수동 로그인 후 생성 필요)
AUTH_STATE_FILE = "tistory_auth_state.json"
TISTORY_WRITE_URL = "https://{blog_name}.tistory.com/manage/post/write"

class AutoPostRequest(BaseModel):
    title: str
    content: str
    blog_name: str
    category: Optional[str] = ""

@router.post("/publish/tistory/auto")
async def auto_post_tistory(post: AutoPostRequest):
    if not os.path.exists(AUTH_STATE_FILE):
        raise HTTPException(
            status_code=401, 
            detail="Authentication state file missing. Please run login script first."
        )

    async with async_playwright() as p:
        # 브라우저 실행 (headless=True 로 하면 서버에서 보이지 않게 실행됨)
        browser = await p.chromium.launch(headless=True)
        # 기존 로그인 세션 로드
        context = await browser.new_context(storage_state=AUTH_STATE_FILE)
        page = await context.new_page()

        try:
            # 글쓰기 페이지 이동
            write_url = f"https://{post.blog_name}.tistory.com/manage/post"
            await page.goto(write_url)
            
            # 1. 제목 입력 (id=title-input 등으로 찾기)
            await page.fill("#post-title-field", post.title)
            
            # 2. 본문 입력 (티스토리는 에디터가 복잡하므로 iframe 내 접근 필요할 수 있음)
            # 여기서는 가장 간단한 방식인 HTML 모드로 전환 후 입력을 시도하거나 직접 입력을 simulate 합니다.
            # 티스토리의 새로운 에디터는 접근이 까다로우므로 에디터 외부에 직접 inject 하는 방식을 주로 씁니다.
            await page.evaluate(f"() => {{ document.querySelector('#post-content-field').innerHTML = `{post.content}`; }}")

            # 3. 발행 버튼 클릭
            await page.click(".btn-publish") # 버튼 선택자는 티스토리 테마에 따라 다를 수 있음
            
            # 최종 발행 확인 버튼 (레이어 팝업 등)
            await page.wait_for_selector(".btn-confirm-publish")
            await page.click(".btn-confirm-publish")

            return {"status": "success", "message": "Post published via browser automation."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            await browser.close()