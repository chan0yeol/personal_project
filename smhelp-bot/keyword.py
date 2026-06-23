# ==========================
# 기본 내장 라이브러리
# ==========================
import os
import re
import time
import json
import base64
import logging
import requests
from io import BytesIO
from datetime import datetime
from typing import List, Dict
from collections import defaultdict
from logging.handlers import TimedRotatingFileHandler
from html import unescape

# ==========================
# 서드파티 라이브러리
# ==========================
from dotenv import load_dotenv
from PIL import Image
import pymysql
from openai import OpenAI
from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

memory = defaultdict(dict)
user_context = {}

# ==============================
# 환경 설정
# ==============================
load_dotenv()
from config import (
    SLACK_BOT_TOKEN, SLACK_APP_TOKEN,
    MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ==============================
# DB 연결
# ==============================
pool = pymysql.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE,
    charset="utf8mb4",
    cursorclass=pymysql.cursors.DictCursor
)

# ==============================
# Slack 초기화
# ==============================
app = App(token=SLACK_BOT_TOKEN)
auth_info = app.client.auth_test()
BOT_USER_ID = auth_info["user_id"]

# ==============================
# 로그 설정
# ==============================
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, "keyword.log")
file_handler = TimedRotatingFileHandler(
    log_file, when="midnight", interval=1, backupCount=7, encoding="utf-8"
)
formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

# ==============================
# 고객사명 캐싱
# ==============================
pool.ping(reconnect=True)
with pool.cursor() as cursor:
    cursor.execute("SELECT CM_NAME FROM customer WHERE CM_NAME IS NOT NULL")
    CM_NAMES = [r["CM_NAME"] for r in cursor.fetchall()]

# ==============================
# OpenAI 클라이언트
# ==============================
client_ai = OpenAI(api_key=OPENAI_API_KEY)
current_year = datetime.now().year


# ==============================
# HTML → Slack 텍스트 변환
# ==============================
def html_to_slack(text):
    """HTML 텍스트를 Slack용 Markdown으로 변환"""
    if not text:
        return ""
    text = text.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    text = re.sub(r"<b>(.*?)</b>", r"*\1*", text)
    text = re.sub(r"<strong>(.*?)</strong>", r"*\1*", text)
    text = re.sub(r"<i>(.*?)</i>", r"_\1_", text)
    text = re.sub(r"<p[^>]*>", "", text)
    text = re.sub(r"</p>", "\n", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\n\s*\n+", "\n", text).strip()
    return text


# ==============================
# OpenAI 키워드 추출
# ==============================
def extract_keywords_with_openai(text: str):
    """문장에서 핵심 키워드, 요청 건수, 정렬, 연도, 조회 조건 추출 (로그 강화)"""
    prompt = f"""
    너는 데이터베이스 검색용 키워드 추출기야.
    현재 연도는 {current_year}년이다.
    사용자의 문장에서 핵심 키워드(keywords), 요청 건수(limit), 정렬(sort), 연도(year),
    조회 조건(query_type)을 JSON으로 반환해.

    출력 예시:
    {{
      "keywords": ["SSL", "신세계푸드"],
      "limit": 5,
      "sort": "desc",
      "year": 2024,
      "query_type": "search"
    }}

    규칙:
    - 문장에 숫자가 있으면 연도로 추정해 "year"에 넣어.
    - "최근", "최신", "등록된"은 sort="desc" + query_type="recent".
    - "오래된", "과거", "이전"은 sort="asc" + query_type="old".
    - "건수", "몇 건", "몇개", "건 보여줘", "몇 건이야"는 query_type="count".
    - "조회", "검색", "찾아", "보여", "관련", "문의", "요청", "내역"이 들어가면 query_type="search".
    - 명사/고유명사(회사명, 제품명, 사람, 기술명, 영어 단어 등)는 keywords로.
    - 아무 정보도 없을 때만 "null"을 반환.
    - JSON만 출력.

    문장: {text}
    """
    try:
        resp = client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
        )
        content = resp.choices[0].message.content.strip()

        m = re.search(r"\{.*\}", content, re.DOTALL)
        if not m:
            return None

        data = json.loads(m.group(0))

        # 폴백: 키워드가 비어있으면 간단 정규식으로 후보 추출
        if not data.get("keywords"):
            candidates = re.findall(r"[A-Za-z가-힣0-9+#._-]{2,}", text)
            # 너무 흔한 단어 제거(한국어 조사/어미 정도 간단 필터)
            stop = {"관련", "문의", "검색", "조회", "찾아줘", "보여줘", "최근", "오래된", "최신", "건수"}
            fallback = [c for c in candidates if c not in stop][:3]
            data["keywords"] = fallback

        return data if isinstance(data, dict) else None
    except Exception as e:
        return None

# ==============================
# 핵심 처리 로직
# ==============================
def process_query(event, client, text, user, channel):
    t0 = time.perf_counter()

    # 숫자 → 접수번호 조회
    sr_idx_match = re.search(r"([0-9]{9,})", text)
    if sr_idx_match:
        sr_idx = sr_idx_match.group(1)
        pool.ping(reconnect=True)
        with pool.cursor() as cursor:
            sql = """
            SELECT SR_IDX, REQ_TITLE, REQ_NAME, CM_NAME, REQ_DATE_ALL, REQ_TXT, STATUS
            FROM support_ticket
            WHERE SR_IDX = %s
            """
            cursor.execute(sql, (sr_idx,))
            ticket = cursor.fetchone()

        if not ticket:
            client.chat_postMessage(channel=channel, text=f"❌ 접수번호 {sr_idx} 에 해당하는 요청을 찾을 수 없습니다.")
            return

        content = html_to_slack(ticket["REQ_TXT"])
        content_preview = content[:300] + "..." if len(content) > 300 else content or "내용 없음"

        blocks = [
            {"type": "section", "text": {"type": "mrkdwn", "text": f"📋 *접수번호:* `{ticket['SR_IDX']}`"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"*제목:* {ticket['REQ_TITLE']}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"🏢 *고객사:* {ticket['CM_NAME']}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"🙋‍♂️ *요청자:* {ticket['REQ_NAME']}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"🗓️ *등록일:* {ticket['REQ_DATE_ALL']}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"👀 *처리상태:* {ticket['STATUS']}"}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"📝 *요청내용 요약:*\n```{content_preview}```"}},
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "🔗 상세보기"},
                        "url": f"https://114.unipost.co.kr/home.uni?access=list&srIdx={ticket['SR_IDX']}"
                    }
                ]
            }
        ]
        client.chat_postMessage(channel=channel, blocks=blocks)
        return

    # OpenAI 키워드 추출
    data = extract_keywords_with_openai(text) or {}

    keywords = data.get("keywords") or []

    # 키워드가 없는 대화만 기억
    if not keywords:
        user_context[user] = {
            "text": text,
            "timestamp": time.time()
        }

    if not data or not data.get("keywords"):
        user_context[user] = {"last_message": text}

        # 일반 대화형 응답 처리
        resp = client_ai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "너는 친절한 고객 지원 챗봇이야. 이전 대화 문맥이 있으면 그것을 고려해서 대답해."},
                {"role": "user", "content": f"이전 대화: {user_context[user].get('last_message', '')}"},
                {"role": "user", "content": text}
            ],
            temperature=0.7,
        )
        ai_reply = resp.choices[0].message.content.strip()
        client.chat_postMessage(channel=channel, text=ai_reply)
        return

    # 키워드가 있으면 → 기존 맥락 삭제
    if data.get("keywords"):
        if user in user_context:
            user_context.pop(user)

    keywords = data.get("keywords") or []
    limit = min(int(data.get("limit") or 5), 10)
    sort_order = (data.get("sort") or "desc").lower()
    year = data.get("year")
    query_type = data.get("query_type")

    cm_keyword = next((cm for cm in CM_NAMES if cm in text or cm in keywords), None)
    remaining_keywords = [kw for kw in keywords if kw != cm_keyword]

    pool.ping(reconnect=True)

    # 문의 건수
    if query_type == "count":
        with pool.cursor() as cursor:
            sql = "SELECT COUNT(*) AS cnt FROM support_ticket WHERE 1=1"
            params = []
            if cm_keyword:
                sql += " AND CM_NAME = %s"
                params.append(cm_keyword)
            if year:
                sql += " AND YEAR(REQ_DATE_ALL) = %s"
                params.append(year)
            cursor.execute(sql, tuple(params))
            count = (cursor.fetchone() or {}).get("cnt", 0)

        msg = f"🏢 *{cm_keyword or '전체'}*"
        if year:
            msg += f" ({year}년)"
        msg += f" 문의 건수는 총 *{count}건* 입니다."
        client.chat_postMessage(channel=channel, text=msg)
        return

    # 리스트 조회 — 키워드 기반 우선 + fallback LIKE
    with pool.cursor() as cursor:
        params = []
        rows = []
        if remaining_keywords:
            # 1️⃣ keyword 테이블 기반 검색
            placeholders = ",".join(["%s"] * len(remaining_keywords))
            sql = f"""
            SELECT
                st.SR_IDX,
                st.REQ_TITLE,
                st.CM_NAME,
                st.REQ_DATE_ALL,
                st.STATUS,
                COUNT(*) AS score
            FROM support_ticket st
            JOIN ticket_keyword tk ON st.SR_IDX = tk.SR_IDX
            JOIN keyword k ON tk.keyword_id = k.keyword_id
            WHERE k.keyword_text IN ({placeholders})
            """
            params.extend(remaining_keywords)

            if cm_keyword:
                sql += " AND st.CM_NAME = %s"
                params.append(cm_keyword)
            if year:
                sql += " AND YEAR(st.REQ_DATE_ALL) = %s"
                params.append(year)

            sql += """
            GROUP BY
                st.SR_IDX,
                st.REQ_TITLE,
                st.CM_NAME,
                st.REQ_DATE_ALL,
                st.STATUS
            ORDER BY
                score DESC,
                st.REQ_DATE_ALL DESC
            LIMIT %s
            """
            params.append(limit)

            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()

            # 2️⃣ fallback — keyword table 매칭 실패 시 LIKE 검색
            if not rows:
                sql = """
                SELECT st.SR_IDX, st.REQ_TITLE, st.CM_NAME, st.REQ_DATE_ALL, st.STATUS
                FROM support_ticket st
                WHERE 1=1
                """
                params = []
                if cm_keyword:
                    sql += " AND st.CM_NAME = %s"
                    params.append(cm_keyword)
                if year:
                    sql += " AND YEAR(st.REQ_DATE_ALL) = %s"
                    params.append(year)

                like_clause = " OR ".join(
                    ["st.REQ_TITLE LIKE %s OR st.REQ_TXT LIKE %s" for _ in remaining_keywords]
                )
                sql += f" AND ({like_clause}) ORDER BY st.REQ_DATE_ALL DESC LIMIT %s"
                for kw in remaining_keywords:
                    params.extend([f"%{kw}%", f"%{kw}%"])
                params.append(limit)

                cursor.execute(sql, tuple(params))
                rows = cursor.fetchall()
        else:
            # 고객사/연도 기준 기본 조회
            sql = """
            SELECT SR_IDX, REQ_TITLE, CM_NAME, REQ_DATE_ALL, STATUS
            FROM support_ticket
            WHERE 1=1
            """
            if cm_keyword:
                sql += " AND CM_NAME = %s"
                params.append(cm_keyword)
            if year:
                sql += " AND YEAR(REQ_DATE_ALL) = %s"
                params.append(year)

            sql += f" ORDER BY REQ_DATE_ALL {'DESC' if sort_order == 'desc' else 'ASC'} LIMIT %s"
            params.append(limit)
            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()

    if not rows:
        msg = f"'{', '.join(keywords)}' 관련 결과가 없습니다." if keywords else "조회된 결과가 없습니다."

        try:
            ai_prompt = f"""
            사용자가 다음 질문을 했지만, 데이터베이스에서 검색 결과가 없습니다.
            질문: "{text}"

            대신 사용자의 질문 의도를 고려해서 의미 있는 답변을 제공해.
            - 모르는 내용은 단정하지 말고, 일반적인 정보나 조언을 중심으로 답변.
            - 불필요한 꾸밈말, 이모티콘, 감정 표현 금지.
            - 자연스러운 존댓말로 간결하게 답변.
            """

            resp = client_ai.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": ai_prompt}],
                temperature=0.5,
            )
            ai_reply = resp.choices[0].message.content.strip()

            # 결과 없음 메시지 + GPT 답변을 하나로 합침
            combined_msg = f"{msg}\n\n{ai_reply}"

            client.chat_postMessage(channel=channel, text=combined_msg)

        except Exception as e:
            client.chat_postMessage(channel=channel, text=msg)

        return

    sort_order = (sort_order or "desc").lower()
    sort_label = "최신순" if sort_order == "desc" else "오래된순"

    intro = (
        f"🔍 *검색 키워드:* {', '.join(keywords)}\n"
        f"📅 정렬: {sort_label}\n"
        f"조회 결과 {len(rows)}건입니다."
    )

    blocks = [
        {"type": "section", "text": {"type": "mrkdwn", "text": intro}},
        {"type": "divider"}
    ]

    for i, r in enumerate(rows, start=1):
        date_str = (
            r["REQ_DATE_ALL"].strftime("%Y-%m-%d")
            if isinstance(r["REQ_DATE_ALL"], datetime)
            else str(r["REQ_DATE_ALL"])
        )
        status = r.get("STATUS", "상태 미정")

        blocks.append({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f"{i}. *{r['REQ_TITLE']}*\n"
                    f"🏢 {r['CM_NAME']} | {date_str} | `{r['SR_IDX']}` | 📌 {status}"
                )
            },
            "accessory": {
                "type": "button",
                "text": {"type": "plain_text", "text": "열기"},
                "url": f"https://114.unipost.co.kr/home.uni?access=list&srIdx={r['SR_IDX']}"
            }
        })

    client.chat_postMessage(channel=channel, blocks=blocks)

# ==============================
# Slack 이벤트 핸들러
# ==============================
@app.event("app_mention")
def handle_mention(event, client):
    text = event.get("text", "")
    user = event.get("user")
    channel = event.get("channel")
    print(f'user: {user}, channel: {channel}, text: {text}')
    process_query(event, client, text, user, channel)

# 3) 핸들러 수정
@app.event("message")
def handle_message(event, client):
    user = event.get("user")
    channel = event.get("channel")
    print(f'user: {user}, channel: {channel}')
    if user is None or user == BOT_USER_ID:
        return

    text = (event.get("text") or "").strip()
    print(f'text: {text}')

    # 텍스트만 있을 때 기존 로직
    if channel and channel.startswith("D") and text:
        process_query(event, client, text, user, channel)

# ==============================
# 실행
# ==============================
if __name__ == "__main__":
    print("⚡ Slack Bot + OpenAI Keyword Search (접수번호 자동인식 + HTML 클린업 적용) Starting...")
    handler = SocketModeHandler(app, SLACK_APP_TOKEN)
    handler.start()
