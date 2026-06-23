import os
import logging
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
CREDENTIALS_PATH = os.getenv("YOUTUBE_CREDENTIALS_PATH", "/app/credentials/credentials.json")
TOKEN_PATH = os.getenv("YOUTUBE_TOKEN_PATH", "/app/credentials/token.json")


def _get_service():
    creds = None

    if Path(TOKEN_PATH).exists():
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not Path(CREDENTIALS_PATH).exists():
                raise FileNotFoundError(
                    f"credentials.json 없음: {CREDENTIALS_PATH}\n"
                    "Google Cloud Console에서 OAuth 2.0 자격증명을 다운로드하세요."
                )
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "w") as f:
            f.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)


def upload_video(script: dict, video_path: Path, thumbnail_path: Path) -> str:
    if os.getenv("DRY_RUN", "false").lower() == "true":
        logger.info(f"[DRY_RUN] 업로드 스킵: {script['title']}")
        return "dry-run"

    youtube = _get_service()

    title = f"{script['title']} #Shorts"
    description = (
        f"{script.get('narration', '')}\n\n"
        "매일 뉴스 요약 영상을 업로드합니다. 구독하고 알림 설정하세요!\n\n"
        + " ".join(f"#{tag}" for tag in script.get("tags", []))
    )

    body = {
        "snippet": {
            "title": title[:100],
            "description": description[:5000],
            "tags": script.get("tags", []),
            "categoryId": "25",
            "defaultLanguage": "ko",
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(str(video_path), mimetype="video/mp4", resumable=True)

    logger.info(f"YouTube 업로드 시작: {title}")
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            logger.info(f"업로드 진행률: {int(status.progress() * 100)}%")

    video_id = response["id"]
    logger.info(f"업로드 완료: https://youtube.com/shorts/{video_id}")

    # 썸네일 업로드
    if thumbnail_path.exists():
        youtube.thumbnails().set(
            videoId=video_id,
            media_body=MediaFileUpload(str(thumbnail_path), mimetype="image/jpeg"),
        ).execute()
        logger.info("썸네일 업로드 완료")

    return video_id
