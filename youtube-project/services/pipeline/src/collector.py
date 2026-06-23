import os
import json
import logging
from datetime import date
from pathlib import Path

import git

logger = logging.getLogger(__name__)

SCRIPTS_DIR = Path("/app/scripts")


def sync_from_github():
    repo_url = os.getenv("GITHUB_REPO")
    if not repo_url:
        logger.info("GITHUB_REPO 미설정 — 로컬 scripts/ 사용")
        return

    token = os.getenv("GITHUB_TOKEN", "")
    if token:
        repo_url = repo_url.replace("https://", f"https://{token}@")

    try:
        if (SCRIPTS_DIR / ".git").exists():
            repo = git.Repo(SCRIPTS_DIR)
            repo.remotes.origin.pull()
            logger.info("GitHub에서 최신 스크립트 pull 완료")
        else:
            git.Repo.clone_from(repo_url, SCRIPTS_DIR)
            logger.info("GitHub 레포 clone 완료")
    except Exception as e:
        logger.error(f"GitHub sync 실패: {e}")


def get_today_script(channel: str) -> dict | None:
    today = date.today().strftime("%Y-%m-%d")
    channel_dir = SCRIPTS_DIR / channel

    if not channel_dir.exists():
        logger.warning(f"채널 디렉토리 없음: {channel_dir}")
        return None

    for json_file in sorted(channel_dir.glob("*.json")):
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)

        for script in data.get("scripts", []):
            if script.get("date") == today and not script.get("uploaded"):
                logger.info(f"오늘 스크립트 발견: {script['title']}")
                return {"file": json_file, "script": script, "channel": channel}

    logger.info(f"{channel}: 오늘({today}) 미사용 스크립트 없음")
    return None


def mark_uploaded(file_path: Path, script_id: str):
    with open(file_path, encoding="utf-8") as f:
        data = json.load(f)

    for script in data.get("scripts", []):
        if script.get("id") == script_id:
            script["uploaded"] = True
            break

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
