from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from google import genai
from google.genai import types
from groq import Groq
import os, json, re, logging

logger = logging.getLogger(__name__)
router = APIRouter()

HUGO_SYSTEM_PROMPT = (
    "당신은 한국어 개발 블로그 전문 작가입니다. "
    "백엔드/인프라/DevOps 개발자를 위한 기술 튜토리얼과 트러블슈팅 가이드를 씁니다. "
    "코드블록(```bash, ```python, ```yaml 등)과 실제 동작하는 예제를 반드시 포함합니다. "
    "한국어로 작성하되, Docker, Python 등 기술 용어는 영문 그대로 사용합니다. "
    "JSON 형식 외에 다른 텍스트를 출력하지 마세요."
)


# ─── Models ──────────────────────────────────────────────────────────────────

class HugoKeywordRequest(BaseModel):
    topic: str = ""
    category: str = ""

class HugoOutlineSection(BaseModel):
    title: str
    points: list[str]

class HugoOutlineRequest(BaseModel):
    topic: str
    categories: list[str] = []
    post_type: str = "tutorial"
    references: list[str] = []

class HugoOutlineResponse(BaseModel):
    title_candidates: list[str]
    sections: list[HugoOutlineSection]
    tags: list[str]
    description: str
    slug: str

class HugoGenerateRequest(BaseModel):
    topic: str
    title: str
    slug: str
    sections: list[HugoOutlineSection]
    tags: list[str] = []
    categories: list[str] = []
    description: str = ""
    post_type: str = "tutorial"
    references: list[str] = []

class HugoGenerateResponse(BaseModel):
    front_matter: str
    content: str
    full_md: str
    slug: str
    provider: str = ""

class HugoDeployRequest(BaseModel):
    slug: str
    full_md: str
    title: str
    cover_url: str = ""
    body_url: str = ""

class HugoDeployResponse(BaseModel):
    github_url: str
    blog_url: str = ""
    oci_status: str = ""


# ─── AI 호출 (Solar → Gemini → Groq 폴백) ────────────────────────────────────

def _call_solar(prompt: str, temperature: float = 0.6) -> dict:
    api_key = os.getenv("UPSTAGE_API_KEY")
    if not api_key:
        raise ValueError("UPSTAGE_API_KEY not set")
    client = OpenAI(api_key=api_key, base_url="https://api.upstage.ai/v1")
    response = client.chat.completions.create(
        model="solar-pro",
        messages=[
            {"role": "system", "content": HUGO_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _call_gemini(prompt: str, temperature: float = 0.6) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    client = genai.Client(api_key=api_key)
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    response = client.models.generate_content(
        model=model,
        contents=f"{HUGO_SYSTEM_PROMPT}\n\n{prompt}",
        config=types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=8192,
            response_mime_type="application/json",
        ),
    )
    return json.loads(response.text)


def _call_groq(prompt: str, temperature: float = 0.6) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")
    client = Groq(api_key=api_key)
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": HUGO_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=8192,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


def _generate(prompt: str) -> tuple[dict, str]:
    for provider, fn in [
        ("solar",  lambda: _call_solar(prompt)),
        ("gemini", lambda: _call_gemini(prompt)),
        ("groq",   lambda: _call_groq(prompt)),
    ]:
        key_map = {"solar": "UPSTAGE_API_KEY", "gemini": "GEMINI_API_KEY", "groq": "GROQ_API_KEY"}
        if not os.getenv(key_map[provider]):
            continue
        try:
            result = fn()
            logger.info(f"[Hugo] {provider} 성공")
            return result, provider
        except Exception as e:
            logger.warning(f"[Hugo] {provider} 실패: {e}")
    raise HTTPException(status_code=500, detail="Solar/Gemini/Groq 모두 생성 실패")


def _to_slug(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text.strip())
    return text[:60]


# ─── 키워드 추천 ──────────────────────────────────────────────────────────────

@router.post("/suggest-keyword")
async def suggest_keyword(req: HugoKeywordRequest):
    topic_hint    = f"\n주제 힌트: {req.topic}" if req.topic else ""
    category_hint = f"\n카테고리: {req.category}" if req.category else ""
    base = f"'{req.topic}' 관련 " if req.topic else ""
    prompt = (
        f"한국 개발자 블로그용 {base}SEO 키워드 5개를 추천하세요.{topic_hint}{category_hint}\n"
        f"조건: 주제 힌트가 있으면 그 기술/주제에 집중해서 추천\n"
        f"실제 개발자가 검색할 만한 롱테일 키워드 (설정/가이드/트러블슈팅/완벽정리 등)\n\n"
        f'JSON: {{"keywords": [{{"keyword": "...", "post_type": "tutorial|troubleshooting"}}]}}'
    )
    result, provider = _generate(prompt)
    return {"keywords": result.get("keywords", []), "provider": provider}


# ─── 개요 생성 ────────────────────────────────────────────────────────────────

@router.post("/outline", response_model=HugoOutlineResponse)
async def generate_outline(req: HugoOutlineRequest):
    post_type_desc = "단계별 튜토리얼" if req.post_type == "tutorial" else "트러블슈팅 가이드"
    cat_str = ", ".join(req.categories) if req.categories else "개발 일반"

    ref_block = ""
    if req.references:
        ref_block = f"\n\n[참고 자료]\n" + "\n\n---\n\n".join(req.references[:3])[:2000]

    prompt = f"""개발 블로그 포스트 개요를 작성하세요.

주제: {req.topic}
카테고리: {cat_str}
글 유형: {post_type_desc}{ref_block}

[규칙]
- 제목 후보 3개 (기술명 + 행동 키워드 포함: 가이드/설정/트러블슈팅/완벽정리)
- 섹션 구성:
  튜토리얼: 개요 → 사전 준비 → 단계별 본문(2~3개) → 트러블슈팅(선택) → 마치며
  트러블슈팅: 문제 상황 → 원인 분석 → 해결 방법(단계별) → 검증 → 마치며
- 각 섹션 핵심 포인트 2~3개
- 태그 5개 (영문 기술 용어 포함)
- description: 영문 소문자+하이픈 slug로 변환 가능한 제목 기반, 120~155자
- slug: 영문 소문자 + 하이픈 (예: docker-compose-network-guide)

JSON으로만 응답:
{{
  "title_candidates": ["제목1", "제목2", "제목3"],
  "sections": [{{"title": "섹션명", "points": ["포인트1", "포인트2"]}}],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "description": "120~155자 설명",
  "slug": "영문-슬러그"
}}"""

    result, provider = _generate(prompt)
    logger.info(f"[Hugo Outline] provider: {provider}")

    sections = [
        HugoOutlineSection(title=s["title"], points=s.get("points", []))
        for s in result.get("sections", [])
    ]
    slug = result.get("slug", "") or _to_slug(result.get("title_candidates", ["post"])[0])

    return HugoOutlineResponse(
        title_candidates=result.get("title_candidates", []),
        sections=sections,
        tags=result.get("tags", []),
        description=result.get("description", ""),
        slug=slug,
    )


# ─── 본문 생성 ────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=HugoGenerateResponse)
async def generate_post(req: HugoGenerateRequest):
    post_type_desc = "단계별 튜토리얼" if req.post_type == "tutorial" else "트러블슈팅 가이드"
    sections_block = "\n".join([
        f"{i+1}. ## {s.title}\n" + "\n".join([f"   - {p}" for p in s.points])
        for i, s in enumerate(req.sections)
    ])

    ref_block = ""
    if req.references:
        ref_block = "\n\n[참고 자료]\n" + "\n\n---\n\n".join(req.references[:3])[:3000]

    prompt = f"""다음 개요를 따라 개발 블로그 포스트 본문을 작성하세요.

제목: {req.title}
주제: {req.topic}
카테고리: {", ".join(req.categories)}
글 유형: {post_type_desc}

[개요]
{sections_block}
{ref_block}

[작성 규칙]
1. 전체 분량: 한국어 기준 공백 포함 최소 7000자 (2000단어 이상) — 이보다 짧으면 실패로 간주
2. 각 섹션 최소 300단어, 설명이 충분히 길어야 함 (짧은 섹션 금지)
3. 코드블록 최소 3개 (```bash, ```python, ```yaml 등 언어 명시 필수)
4. 코드는 실제 동작하는 예제 사용, 각 코드블록 전후로 충분한 설명 추가
5. H2(##) 소제목 최소 4개
6. 공식 문서 링크 2개 이상 (실제 URL)
7. 도입부 첫 문장에 주제 키워드 포함, 도입부 최소 200자
8. 한국어 + 영문 기술 용어 자연스럽게 혼용
9. 주의사항/팁은 > 인용 블록으로 표시
10. 마치며 섹션: 핵심 요약 3줄 + 참고 링크

[금지]
- 존재하지 않는 URL 사용 금지
- 의미 없는 예시 코드 금지 (실제 동작 기준으로 작성)
- 섹션을 짧게 끝내지 말 것 — 각 섹션은 충분한 설명과 예제를 포함해야 함

JSON으로만 응답 (content는 마크다운 문자열, front_matter 제외):
{{
  "content": "## 개요\\n\\n내용...",
  "description": "{req.description}"
}}"""

    result, provider = _generate(prompt)
    logger.info(f"[Hugo Generate] provider: {provider}")

    from datetime import date
    import yaml

    cats = req.categories if req.categories else ["개발"]
    fm_dict = {
        "title": req.title,
        "date": date.today().isoformat(),
        "draft": False,
        "categories": cats,
        "tags": req.tags,
        "description": result.get("description", req.description),
        "slug": req.slug,
        "showToc": True,
        "TocOpen": False,
        "hidemeta": False,
        "comments": False,
        "disableShare": False,
    }
    front_matter = "---\n" + yaml.dump(fm_dict, allow_unicode=True, default_flow_style=False) + "---"
    content = result.get("content", "")
    full_md = f"{front_matter}\n\n{content}"

    return HugoGenerateResponse(
        front_matter=front_matter,
        content=content,
        full_md=full_md,
        slug=req.slug,
        provider=provider,
    )


# ─── 배포 (GitHub 커밋 + OCI 빌드) ───────────────────────────────────────────

@router.post("/deploy", response_model=HugoDeployResponse)
async def deploy_post(req: HugoDeployRequest):
    github_token = os.getenv("GITHUB_TOKEN")
    github_repo  = os.getenv("GITHUB_REPO")
    content_path = os.getenv("HUGO_CONTENT_PATH", "content/posts")

    if not github_token or not github_repo:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN 또는 GITHUB_REPO가 설정되지 않았습니다.")

    try:
        import httpx
        from github import Github, GithubException
        g = Github(github_token)
        repo = g.get_repo(github_repo)

        full_md = req.full_md

        print(f"[Hugo Deploy] cover_url={req.cover_url!r}", flush=True)
        print(f"[Hugo Deploy] body_url={req.body_url!r}", flush=True)

        # ── 이미지 다운로드 → static/images/ 업로드 ──────────────────────────
        async def upload_image(url: str, filename: str) -> str:
            print(f"[Hugo Deploy] 이미지 다운로드 시작: {url[:60]}", flush=True)
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                r = await client.get(url)
                r.raise_for_status()
                img_bytes = r.content
            print(f"[Hugo Deploy] 다운로드 완료: {len(img_bytes)} bytes", flush=True)

            img_path = f"static/images/{filename}"
            try:
                existing_img = repo.get_contents(img_path)
                repo.update_file(img_path, f"update image: {filename}", img_bytes, existing_img.sha)
            except Exception:
                repo.create_file(img_path, f"add image: {filename}", img_bytes)

            print(f"[Hugo Deploy] GitHub 업로드 완료: {img_path}", flush=True)
            return f"/images/{filename}"

        if req.cover_url:
            ext = req.cover_url.split(".")[-1].split("?")[0][:4] or "jpg"
            cover_path = await upload_image(req.cover_url, f"{req.slug}-cover.{ext}")
            cover_block = (
                f"cover:\n"
                f"  image: \"{cover_path}\"\n"
                f"  alt: \"{req.title}\"\n"
                f"  caption: \"\"\n"
                f"  relative: false\n"
            )
            full_md = re.sub(r'\n---(\n|$)', f'\n{cover_block}---\n', full_md, count=1)
            print(f"[Hugo Deploy] 대표이미지 front matter 주입 완료", flush=True)

        if req.body_url:
            ext = req.body_url.split(".")[-1].split("?")[0][:4] or "jpg"
            body_path = await upload_image(req.body_url, f"{req.slug}-body.{ext}")
            img_md = f"\n\n![{req.title}]({body_path})\n"
            full_md = re.sub(r'(^## .+$)', r'\1' + img_md, full_md, count=1, flags=re.MULTILINE)
            print(f"[Hugo Deploy] 본문이미지 주입 완료", flush=True)

        # ── md 파일 커밋 ──────────────────────────────────────────────────────
        file_path = f"{content_path}/{req.slug}.md"
        try:
            existing = repo.get_contents(file_path)
            repo.update_file(file_path, f"update: {req.title}", full_md.encode("utf-8"), existing.sha)
        except GithubException:
            repo.create_file(file_path, f"add: {req.title}", full_md.encode("utf-8"))

        github_url = f"https://github.com/{github_repo}/blob/main/{file_path}"
        logger.info(f"[Hugo Deploy] GitHub 커밋 완료: {file_path}")
    except Exception as e:
        logger.error(f"[Hugo Deploy] GitHub 실패: {e}")
        raise HTTPException(status_code=500, detail=f"GitHub 커밋 실패: {e}")

    oci_status = ""
    oci_ip   = os.getenv("OCI_IP")
    oci_user = os.getenv("OCI_USER", "ubuntu")
    oci_key  = os.getenv("OCI_KEY_PATH")
    oci_path = os.getenv("OCI_BLOG_PATH", "/home/ubuntu/blog")

    if oci_ip and oci_key:
        try:
            import paramiko
            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            ssh.connect(oci_ip, username=oci_user, key_filename=oci_key, timeout=30)
            _, stdout, stderr = ssh.exec_command(f"cd {oci_path} && git pull && hugo && bash deploy.sh")
            out = stdout.read().decode()
            err = stderr.read().decode()
            ssh.close()
            oci_status = "success" if not err else f"warn: {err[:200]}"
            logger.info(f"[Hugo Deploy] OCI 빌드: {oci_status}")
        except Exception as e:
            oci_status = f"skip: {e}"
            logger.warning(f"[Hugo Deploy] OCI 빌드 실패 (무시): {e}")
    else:
        oci_status = "skip: OCI_IP 또는 OCI_KEY_PATH 미설정"

    blog_base = os.getenv("HUGO_BLOG_URL", "")
    blog_url  = f"{blog_base}/posts/{req.slug}/" if blog_base else ""

    return HugoDeployResponse(
        github_url=github_url,
        blog_url=blog_url,
        oci_status=oci_status,
    )


# ─── 포스트 목록 조회 ─────────────────────────────────────────────────────────

@router.get("/posts")
async def list_posts():
    github_token = os.getenv("GITHUB_TOKEN")
    github_repo  = os.getenv("GITHUB_REPO")
    content_path = os.getenv("HUGO_CONTENT_PATH", "content/posts")

    if not github_token or not github_repo:
        return {"posts": []}

    try:
        from github import Github
        g = Github(github_token)
        repo = g.get_repo(github_repo)
        contents = repo.get_contents(content_path)
        posts = [
            {"name": f.name, "path": f.path, "sha": f.sha}
            for f in contents
            if f.name.endswith(".md")
        ]
        return {"posts": sorted(posts, key=lambda x: x["name"], reverse=True)}
    except Exception as e:
        logger.warning(f"[Hugo Posts] 조회 실패: {e}")
        return {"posts": []}
