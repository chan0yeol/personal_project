import logging
from pathlib import Path
from gtts import gTTS

logger = logging.getLogger(__name__)


def generate_tts(text: str, output_path: Path) -> Path:
    logger.info(f"TTS 생성 중... ({len(text)}자)")
    tts = gTTS(text=text, lang="ko", slow=False)
    tts.save(str(output_path))
    logger.info(f"TTS 저장: {output_path}")
    return output_path
