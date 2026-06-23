import logging
import os
from datetime import datetime
from pathlib import Path

from apscheduler.schedulers.blocking import BlockingScheduler

from news_rss import fetch_top_news
from script_gen import generate_script
from market_data import fetch_indices
from tts_gen import generate_tts
from video_gen import create_video
from thumbnail_gen import create_thumbnail
from uploader import upload_video

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")

OUTPUT_DIR = Path("/app/output")
UPLOAD_HOUR = int(os.getenv("UPLOAD_HOUR", "7"))
UPLOAD_MINUTE = int(os.getenv("UPLOAD_MINUTE", "0"))


def run_pipeline():
    logger.info("=" * 50)
    logger.info(f"파이프라인 시작: {datetime.now()}")

    try:
        articles = fetch_top_news(count=10)
        if not articles:
            logger.error("뉴스 수집 실패 — 오늘 실행 종료")
            return

        indices = fetch_indices()
        script = generate_script(articles)
        script_id = script["id"]

        work_dir = OUTPUT_DIR / script_id
        work_dir.mkdir(parents=True, exist_ok=True)

        audio_path = work_dir / "narration.mp3"
        video_path = work_dir / "video.mp4"
        thumbnail_path = work_dir / "thumbnail.jpg"

        generate_tts(script["narration"], audio_path)
        create_video(script, audio_path, video_path, indices=indices)
        create_thumbnail(script, thumbnail_path)
        upload_video(script, video_path, thumbnail_path)

        logger.info(f"완료: {script['title']}")

    except Exception as e:
        logger.error(f"파이프라인 실패: {e}", exc_info=True)

    logger.info("=" * 50)


def main():
    logger.info("YouTube Shorts 자동화 파이프라인 시작")
    logger.info(f"업로드 시간: 매일 {UPLOAD_HOUR:02d}:{UPLOAD_MINUTE:02d} KST")
    logger.info(f"DRY_RUN: {os.getenv('DRY_RUN', 'false')}")

    if os.getenv("RUN_ON_START", "false").lower() == "true":
        run_pipeline()

    scheduler = BlockingScheduler(timezone="Asia/Seoul")
    scheduler.add_job(run_pipeline, "cron", hour=UPLOAD_HOUR, minute=UPLOAD_MINUTE)
    logger.info("스케줄러 대기 중...")

    try:
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("종료")


if __name__ == "__main__":
    main()
