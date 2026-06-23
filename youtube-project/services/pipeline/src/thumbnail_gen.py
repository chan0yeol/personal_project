import textwrap
import logging
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

WIDTH, HEIGHT = 1280, 720
FONT_BOLD = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"


def create_thumbnail(script: dict, output_path: Path) -> Path:
    img = Image.new("RGB", (WIDTH, HEIGHT), color=(10, 10, 40))
    draw = ImageDraw.Draw(img)

    # 배경 그라데이션 효과 (좌→우)
    for x in range(WIDTH):
        ratio = x / WIDTH
        r = int(10 + 30 * ratio)
        g = int(10 + 10 * ratio)
        b = int(40 + 60 * ratio)
        draw.line([(x, 0), (x, HEIGHT)], fill=(r, g, b))

    try:
        font_large = ImageFont.truetype(FONT_BOLD, 100)
        font_medium = ImageFont.truetype(FONT_BOLD, 60)
    except Exception:
        font_large = font_medium = ImageFont.load_default()

    thumbnail_text = script.get("thumbnail_text", script["title"])
    lines = thumbnail_text.split("\n")

    y = HEIGHT // 2 - len(lines) * 60
    for line in lines:
        draw.text((WIDTH // 2, y), line, font=font_large, fill=(255, 255, 255), anchor="mm")
        y += 120

    # 날짜 표시
    draw.text((WIDTH // 2, HEIGHT - 60), script.get("date", ""), font=font_medium,
              fill=(255, 80, 80), anchor="mm")

    img.save(str(output_path), "JPEG", quality=95)
    logger.info(f"썸네일 저장: {output_path}")
    return output_path
