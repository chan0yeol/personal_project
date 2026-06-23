import logging
import textwrap
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from moviepy.editor import AudioFileClip, ImageClip, concatenate_videoclips
from market_data import format_price, format_change

logger = logging.getLogger(__name__)

WIDTH, HEIGHT = 1080, 1920
FONT_BOLD = "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"

# 금융 테마 색상
BG_TOP = (8, 12, 26)          # 딥 네이비
BG_BOTTOM = (14, 24, 48)      # 다크 블루
ACCENT = (255, 200, 0)        # 골드
WHITE = (255, 255, 255)
LIGHT_GRAY = (180, 200, 230)
CARD_BG = (255, 255, 255, 30)


def _load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def _gradient_bg():
    img = Image.new("RGB", (WIDTH, HEIGHT))
    for y in range(HEIGHT):
        t = y / HEIGHT
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        for x in range(WIDTH):
            img.putpixel((x, y), (r, g, b))
    return img


def _draw_text_centered(draw, text, font, y, fill, max_width=WIDTH - 120):
    avg_w = max(1, font.getbbox("가")[2])
    max_chars = max(1, int(max_width / avg_w))
    lines = textwrap.wrap(text, width=max_chars)
    lh = font.getbbox("가")[3] + 16
    for i, line in enumerate(lines):
        draw.text((WIDTH // 2, y + i * lh), line, font=font, fill=fill, anchor="mm")
    return lh * len(lines)


def _progress_bar(draw, total, current):
    bar_w = 60
    gap = 16
    total_w = total * bar_w + (total - 1) * gap
    sx = (WIDTH - total_w) // 2
    y = HEIGHT - 90
    h = 10
    for i in range(total):
        x = sx + i * (bar_w + gap)
        color = ACCENT if i == current else (80, 90, 120)
        draw.rounded_rectangle([x, y, x + bar_w, y + h], radius=5, fill=color)


def create_intro_frame(script: dict) -> Image.Image:
    img = _gradient_bg()
    draw = ImageDraw.Draw(img)

    f_badge = _load_font(FONT_BOLD, 44)
    f_top = _load_font(FONT_BOLD, 120)
    f_num = _load_font(FONT_BOLD, 280)
    f_date = _load_font(FONT_REGULAR, 44)
    f_sub = _load_font(FONT_REGULAR, 46)

    # 상단 배지
    bw, bh = 420, 70
    bx = (WIDTH - bw) // 2
    draw.rounded_rectangle([bx, 160, bx + bw, 160 + bh], radius=35, fill=ACCENT)
    draw.text((WIDTH // 2, 196), "🇺🇸  간밤 미국장", font=f_badge, fill=(20, 20, 20), anchor="mm")

    # TOP + 5
    draw.text((WIDTH // 2, 700), "TOP", font=f_top, fill=WHITE, anchor="mm")
    draw.text((WIDTH // 2, 1000), "5", font=f_num, fill=ACCENT, anchor="mm")

    # 날짜
    draw.text((WIDTH // 2, 1300), script.get("date", ""), font=f_date, fill=LIGHT_GRAY, anchor="mm")

    # 하단 안내
    draw.text((WIDTH // 2, HEIGHT - 160), "지금 바로 확인하세요 👇", font=f_sub, fill=LIGHT_GRAY, anchor="mm")

    return img


def create_indices_frame(indices: list[dict]) -> Image.Image:
    img = _gradient_bg()
    draw = ImageDraw.Draw(img)

    f_title = _load_font(FONT_BOLD, 50)
    f_name = _load_font(FONT_BOLD, 58)
    f_price = _load_font(FONT_BOLD, 52)
    f_arrow = _load_font(FONT_BOLD, 44)
    f_change = _load_font(FONT_BOLD, 48)
    f_pct = _load_font(FONT_BOLD, 54)

    # 상단 배지
    bw, bh = 520, 70
    bx = (WIDTH - bw) // 2
    draw.rounded_rectangle([bx, 120, bx + bw, 120 + bh], radius=35, fill=ACCENT)
    draw.text((WIDTH // 2, 156), "📊  어제 미국 주요 지수", font=f_title, fill=(20, 20, 20), anchor="mm")

    card_h = 240
    card_margin = 20
    start_y = 260

    for i, idx in enumerate(indices):
        y = start_y + i * (card_h + card_margin)
        up = idx["up"]
        color = (0, 220, 120) if up else (255, 75, 75)

        # 카드 배경
        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
        ov_draw = ImageDraw.Draw(overlay)
        ov_draw.rounded_rectangle([50, y, WIDTH - 50, y + card_h], radius=20, fill=(255, 255, 255, 20))
        img_rgba = img.convert("RGBA")
        img = Image.alpha_composite(img_rgba, overlay).convert("RGB")
        draw = ImageDraw.Draw(img)

        # 좌측 색상 바
        draw.rounded_rectangle([50, y + 10, 72, y + card_h - 10], radius=10, fill=color)

        # 지수명
        draw.text((100, y + 28), idx["name"], font=f_name, fill=WHITE)

        # 전일가 → 현재가
        prev_str = format_price(idx["prev"], idx["prefix"])
        curr_str = format_price(idx["price"], idx["prefix"])
        row = f"{prev_str}  →  {curr_str}"
        draw.text((100, y + 110), row, font=f_price, fill=LIGHT_GRAY)

        # 포인트 변동 + 퍼센트
        sign = "+" if up else ""
        point_str = f"{sign}{idx['change']:,.2f}"
        pct_str = f"({sign}{idx['change_pct']:.2f}%)"
        arrow = "▲" if up else "▼"
        change_line = f"{arrow} {point_str}  {pct_str}"
        draw.text((100, y + 178), change_line, font=f_change, fill=color)

    return img


def create_news_frame(index: int, item: dict, total: int) -> Image.Image:
    headline = item.get("headline", "")
    summary = item.get("summary", "")

    img = _gradient_bg()
    draw = ImageDraw.Draw(img, "RGBA")

    f_label = _load_font(FONT_REGULAR, 38)
    f_num = _load_font(FONT_BOLD, 110)
    f_headline = _load_font(FONT_BOLD, 66)
    f_summary = _load_font(FONT_REGULAR, 42)

    # 상단 레이블
    draw.text((WIDTH // 2, 140), "🇺🇸  간밤 미국장 TOP5", font=f_label, fill=LIGHT_GRAY, anchor="mm")

    # 번호 뱃지 (원형)
    cx, cy, cr = WIDTH // 2, 440, 110
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=ACCENT)
    draw.text((cx, cy), str(index), font=f_num, fill=(20, 20, 20), anchor="mm")

    # 카드 배경
    card_top, card_bot = 580, 1550
    overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)
    ov_draw.rounded_rectangle([60, card_top, WIDTH - 60, card_bot], radius=30, fill=(255, 255, 255, 25))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 헤드라인
    h = _draw_text_centered(draw, headline, f_headline, 720, WHITE, max_width=WIDTH - 160)

    # 구분선
    line_y = 720 + h + 30
    draw.rectangle([120, line_y, WIDTH - 120, line_y + 2], fill=ACCENT)

    # 요약
    _draw_text_centered(draw, summary, f_summary, line_y + 50, LIGHT_GRAY, max_width=WIDTH - 140)

    # 진행 바
    _progress_bar(draw, total, index - 1)

    return img


def create_outro_frame() -> Image.Image:
    img = _gradient_bg()
    draw = ImageDraw.Draw(img)

    f_lg = _load_font(FONT_BOLD, 88)
    f_md = _load_font(FONT_BOLD, 56)
    f_sm = _load_font(FONT_REGULAR, 44)

    bw, bh = 420, 70
    bx = (WIDTH - bw) // 2
    draw.rounded_rectangle([bx, 160, bx + bw, 160 + bh], radius=35, fill=ACCENT)
    draw.text((WIDTH // 2, 196), "🇺🇸  간밤 미국장", font=f_md, fill=(20, 20, 20), anchor="mm")

    draw.text((WIDTH // 2, 780), "구독하고", font=f_lg, fill=WHITE, anchor="mm")
    draw.text((WIDTH // 2, 900), "매일 아침 미국장", font=f_lg, fill=ACCENT, anchor="mm")
    draw.text((WIDTH // 2, 1020), "받아보세요!", font=f_lg, fill=WHITE, anchor="mm")

    draw.text((WIDTH // 2, 1240), "🔔  알림설정 필수!", font=f_md, fill=LIGHT_GRAY, anchor="mm")
    draw.text((WIDTH // 2, 1340), "매일 아침 7시 업로드", font=f_sm, fill=LIGHT_GRAY, anchor="mm")

    return img


def create_video(script: dict, audio_path: Path, output_path: Path, indices: list = None) -> Path:
    logger.info("영상 생성 중...")

    audio = AudioFileClip(str(audio_path))
    news_items = script.get("news_items", [])

    # news_items 없으면 subtitle_lines로 폴백
    if not news_items:
        news_items = [{"headline": s, "summary": ""} for s in script.get("subtitle_lines", [])]

    n = len(news_items)
    intro_dur = 3.0
    outro_dur = 2.5
    news_dur = max(12.0, (audio.duration - intro_dur - outro_dur) / n if n else audio.duration)

    clips = [ImageClip(np.array(create_intro_frame(script))).set_duration(intro_dur)]

    if indices:
        clips.append(ImageClip(np.array(create_indices_frame(indices))).set_duration(5.0))

    for i, item in enumerate(news_items):
        clips.append(ImageClip(np.array(create_news_frame(i + 1, item, n))).set_duration(news_dur))
    clips.append(ImageClip(np.array(create_outro_frame())).set_duration(outro_dur))

    final = concatenate_videoclips(clips, method="compose", padding=-0.4)
    final = final.set_audio(audio.subclip(0, min(audio.duration, final.duration)))

    final.write_videofile(
        str(output_path),
        fps=24,
        codec="libx264",
        audio_codec="aac",
        bitrate="4000k",
        audio_bitrate="192k",
        logger=None,
    )

    logger.info(f"영상 저장 완료: {output_path}")
    return output_path
