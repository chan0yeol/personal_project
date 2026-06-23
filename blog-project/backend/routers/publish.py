from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import base64
import os
import logging
import io
import markdown as md
import re
from PIL import Image

logger = logging.getLogger(__name__)

router = APIRouter()


def _auth_header() -> str:
    user = os.getenv("WP_USER", "").strip()
    # Application Password의 공백은 유지 (WordPress 형식), 앞뒤 따옴표/공백만 제거
    password = os.getenv("WP_APP_PASSWORD", "").strip().strip('"').strip("'")
    if not user or not password:
        raise HTTPException(status_code=500, detail="WP_USER 또는 WP_APP_PASSWORD가 설정되지 않았습니다.")
    token = base64.b64encode(f"{user}:{password}".encode()).decode()
    return f"Basic {token}"


def _wp_url() -> str:
    url = os.getenv("WP_URL", "").rstrip("/")
    if not url:
        raise HTTPException(status_code=500, detail="WP_URL이 설정되지 않았습니다.")
    return url


@router.get("/wp-test")
async def wp_test():
    """WordPress 연결 및 권한 진단 — 실제 draft 생성으로 권한 확인"""
    wp_url = _wp_url()
    headers = {"Authorization": _auth_header(), "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=10) as client:
        # 사용자 정보
        me = await client.get(f"{wp_url}/wp-json/wp/v2/users/me?context=edit", headers=headers)
        if me.status_code == 401:
            return {"ok": False, "error": "인증 실패 — WP_USER/WP_APP_PASSWORD 확인 필요"}

        user = me.json()

        # 실제 draft 생성 시도
        test_post = await client.post(
            f"{wp_url}/wp-json/wp/v2/posts",
            headers=headers,
            json={"title": "[테스트] 권한 확인용 임시글", "status": "draft", "content": "테스트"},
        )

        if test_post.status_code in (200, 201):
            post_id = test_post.json().get("id")
            # 생성된 테스트 글 즉시 삭제
            await client.delete(f"{wp_url}/wp-json/wp/v2/posts/{post_id}?force=true", headers=headers)
            return {"ok": True, "user": user.get("name"), "roles": user.get("roles", []), "caps": list(user.get("capabilities", {}).keys())[:10]}

        return {
            "ok": False,
            "user": user.get("name"),
            "roles": user.get("roles", []),
            "post_error": test_post.status_code,
            "post_detail": test_post.json(),
        }


class BodyImage(BaseModel):
    url: str
    alt: str = ""


class PublishRequest(BaseModel):
    title: str
    content: str           # 마크다운
    tags: list[str] = []
    status: str = "draft"  # draft | publish
    image_url: str | None = None   # 대표 이미지 URL (선택)
    body_images: list[BodyImage] = []  # 본문 삽입용 이미지들 (H2 사이에 자동 분배)
    meta_description: str = ""
    focus_keyword: str = ""


class PublishResponse(BaseModel):
    post_id: int
    url: str
    status: str


@router.post("/publish", response_model=PublishResponse)
async def publish_post(req: PublishRequest):
    wp_url = _wp_url()
    headers = {
        "Authorization": _auth_header(),
        "Content-Type": "application/json",
    }

    # 본문 이미지를 WP 미디어 라이브러리에 먼저 업로드 → 자체 URL로 교체
    uploaded_body_images: list[BodyImage] = []
    for img in req.body_images:
        alt = img.alt or req.title
        wp_img_url = await _upload_image_and_get_url(wp_url, headers, img.url, req.title, alt)
        if wp_img_url:
            uploaded_body_images.append(BodyImage(url=wp_img_url, alt=alt))
        else:
            # 업로드 실패 시 원본 URL fallback
            logger.warning(f"[BodyImage] 업로드 실패 — 원본 URL 사용: {img.url}")
            uploaded_body_images.append(BodyImage(url=img.url, alt=alt))

    # 본문 이미지를 마크다운의 H2 섹션 사이에 자동 분배 삽입
    md_content = _inject_body_images(req.content, uploaded_body_images, req.title)

    # 마크다운 → HTML 변환
    html_content = md.markdown(
        md_content,
        extensions=["extra", "nl2br"],
    )

    tag_ids = await _get_or_create_tags(wp_url, headers, req.tags)
    featured_media_id = None

    if req.image_url:
        focus_kw = req.focus_keyword or (req.tags[0] if req.tags else req.title)
        featured_media_id, featured_wp_url = await _upload_image_from_url(wp_url, headers, req.image_url, req.title, focus_kw)
        # 본문 상단에 이미지 삽입 (WP 자체 URL 사용, 업로드 실패 시 원본 URL fallback)
        top_img_url = featured_wp_url or req.image_url
        img_tag = f'<img src="{top_img_url}" alt="{focus_kw}" style="width:100%;height:auto;margin-bottom:1.5em;" />\n\n'
        html_content = img_tag + html_content

    focus_kw = req.focus_keyword or (req.tags[0] if req.tags else "")

    payload: dict = {
        "title": req.title,
        "content": html_content,
        "status": req.status,
        "tags": tag_ids,
        "meta": {
            "rank_math_focus_keyword": focus_kw,
            "rank_math_title": req.title,
            "rank_math_description": req.meta_description,
        },
    }
    if featured_media_id:
        payload["featured_media"] = featured_media_id
    if req.meta_description:
        payload["excerpt"] = req.meta_description

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{wp_url}/wp-json/wp/v2/posts", headers=headers, json=payload)

    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=resp.status_code, detail=f"WordPress 오류: {resp.text[:300]}")

    data = resp.json()
    return PublishResponse(post_id=data["id"], url=data["link"], status=data["status"])


def _inject_body_images(markdown_text: str, images: list[BodyImage], fallback_alt: str) -> str:
    """
    마크다운 본문의 H2(##) 섹션 사이사이에 이미지를 균등 분배 삽입.
    - 첫 H2(도입부 다음) 이후부터 마지막 H2 이전까지의 H2들 중에 분배
    - 이미지가 섹션 수보다 많으면 일부 섹션에 2장 들어갈 수 있음
    """
    if not images:
        return markdown_text

    lines = markdown_text.split("\n")
    # H2 시작 라인 인덱스 수집 (## 로 시작, ### 제외)
    h2_indices = [i for i, ln in enumerate(lines) if re.match(r"^##\s+(?!#)", ln)]

    if len(h2_indices) <= 1:
        # H2가 거의 없으면 본문 끝에 모두 추가
        for img in images:
            alt = img.alt or fallback_alt
            lines.append("")
            lines.append(f'<figure><img src="{img.url}" alt="{alt}" style="width:100%;height:auto;border-radius:8px;" /><figcaption style="text-align:center;font-size:0.9em;color:#666;">{alt}</figcaption></figure>')
        return "\n".join(lines)

    # 첫 번째 H2(도입부 직후 섹션) 제외하고, 나머지 H2 앞에 균등 분배
    target_h2 = h2_indices[1:]  # 두 번째 H2부터
    if not target_h2:
        target_h2 = h2_indices

    # 이미지를 target_h2에 분배: 이미지 i번째 → target_h2[i % len(target_h2)] 위에 삽입
    # 같은 위치에 여러 장이면 순서대로 쌓음
    insertions: dict[int, list[str]] = {}
    for i, img in enumerate(images):
        idx = target_h2[i % len(target_h2)]
        alt = img.alt or fallback_alt
        block = f'\n<figure><img src="{img.url}" alt="{alt}" style="width:100%;height:auto;border-radius:8px;margin:1.5em 0;" /><figcaption style="text-align:center;font-size:0.9em;color:#666;">{alt}</figcaption></figure>\n'
        insertions.setdefault(idx, []).append(block)

    # 뒤에서부터 삽입 (인덱스 안 깨짐)
    for idx in sorted(insertions.keys(), reverse=True):
        for block in reversed(insertions[idx]):
            lines.insert(idx, block)

    return "\n".join(lines)


async def _get_or_create_tags(wp_url: str, headers: dict, tag_names: list[str]) -> list[int]:
    ids = []
    async with httpx.AsyncClient(timeout=15) as client:
        for name in tag_names:
            r = await client.get(
                f"{wp_url}/wp-json/wp/v2/tags",
                headers=headers,
                params={"search": name, "per_page": 1},
            )
            results = r.json()
            if results and isinstance(results, list) and results[0].get("name") == name:
                ids.append(results[0]["id"])
            else:
                cr = await client.post(
                    f"{wp_url}/wp-json/wp/v2/tags",
                    headers=headers,
                    json={"name": name},
                )
                if cr.status_code in (200, 201):
                    ids.append(cr.json()["id"])
    return ids


async def _upload_image_from_url(wp_url: str, headers: dict, image_url: str, title: str, alt_text: str = "") -> tuple[int | None, str | None]:
    """이미지를 WP 미디어로 업로드. (media_id, source_url) 반환. 실패 시 (None, None)."""
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            img_resp = await client.get(image_url)
            img_resp.raise_for_status()

        import time
        # Content-Disposition 헤더는 ASCII만 허용 → 한글/특수문자 제거 후 영숫자만 사용
        raw_slug = re.sub(r"[^a-zA-Z0-9]+", "-", (alt_text or ""))[:40].strip("-")
        slug = raw_slug or f"health-img-{int(time.time())}"

        # GIF는 애니메이션 보존을 위해 원본 유지, 나머지는 WebP 변환
        raw_ct = img_resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        if raw_ct == "image/gif":
            img_bytes = img_resp.content
            content_type = "image/gif"
            filename = f"{slug}-{int(time.time() * 1000)}.gif"
        else:
            try:
                pil_img = Image.open(io.BytesIO(img_resp.content)).convert("RGBA")
                buf = io.BytesIO()
                pil_img.save(buf, format="WEBP", quality=85, method=4)
                img_bytes = buf.getvalue()
                content_type = "image/webp"
                filename = f"{slug}-{int(time.time() * 1000)}.webp"
                logger.info(f"[Image] WebP 변환 완료: {len(img_resp.content)} → {len(img_bytes)} bytes")
            except Exception as e:
                logger.warning(f"[Image] WebP 변환 실패, 원본 사용: {e}")
                img_bytes = img_resp.content
                content_type = raw_ct if raw_ct in ("image/jpeg", "image/png", "image/webp") else "image/jpeg"
                ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(content_type, "jpg")
                filename = f"{slug}-{int(time.time() * 1000)}.{ext}"

        upload_headers = {
            "Authorization": headers["Authorization"],
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": content_type,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                f"{wp_url}/wp-json/wp/v2/media",
                headers=upload_headers,
                content=img_bytes,
            )

        if r.status_code in (200, 201):
            data = r.json()
            media_id = data["id"]
            source_url = data.get("source_url") or data.get("guid", {}).get("rendered")
            logger.info(f"[Image] Uploaded: id={media_id} url={source_url}")
            if alt_text:
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.post(
                        f"{wp_url}/wp-json/wp/v2/media/{media_id}",
                        headers={**headers, "Content-Type": "application/json"},
                        json={"alt_text": alt_text, "caption": alt_text, "title": alt_text},
                    )
            return media_id, source_url
        else:
            logger.error(f"[Image] Upload failed: {r.status_code} — {r.text[:200]}")
    except Exception as e:
        logger.error(f"[Image] Exception: {e}")
    return None, None


async def _upload_image_and_get_url(wp_url: str, headers: dict, image_url: str, title: str, alt_text: str = "") -> str | None:
    """본문 이미지용 — WP 미디어 업로드 후 source_url만 반환."""
    _, src = await _upload_image_from_url(wp_url, headers, image_url, title, alt_text)
    return src
