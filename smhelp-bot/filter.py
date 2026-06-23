import imaplib
import email
import re
import json
import os
import requests
from email.header import decode_header
import time

from dotenv import load_dotenv
import logging
import re
from openai import OpenAI
from slack_sdk import WebClient

load_dotenv()
from config import (
    OPENAI_API_KEY,
    SLACK_BOT_TOKEN
)

client_ai = OpenAI(api_key=OPENAI_API_KEY) # API KEY 설정
slack_client = WebClient(token=SLACK_BOT_TOKEN)

SLACK_CHANNEL = "#org-구독1팀"
THREAD_MAP_FILE = "thread_map.json"


# Mail IMAP 정보 ex)
IMAP_HOST = 'imap.gmail.com'
IMAP_PORT = 993
EMAIL_USER = '1234@gmail.com'  # 자신의 Mail 주소로 수정
EMAIL_PASS = ''  # 2단계 인증 앱 비밀번호

logger = logging.getLogger("email_summarizer")
if not logger.handlers:
    handler = logging.FileHandler("email_summary.log", encoding="utf-8")
    formatter = logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

# ==========================
# 이메일 요약 함수
# ==========================
def summarize_email_with_openai(text: str):
    """이메일 본문을 요약해서 핵심 내용만 반환"""
    if not text or len(text.strip()) < 20:
        logger.warning("[SKIP] 본문 내용이 너무 짧아 요약 불가" + text)
        return "본문 내용이 부족하여 요약할 수 없습니다."

    prompt = f"""
    너는 이메일 분석가야.
    아래는 실제 고객 문의 또는 업무 메일의 본문이야.
    핵심 요청 내용, 관련 주제, 필요한 조치가 있다면 간결하게 요약해줘.
    불필요한 인사말, 서명, 반복 문장은 제거해.
    3줄 이내의 자연스러운 한국어 문장으로 요약해.

    --- 이메일 본문 ---
    {text}
    """

    try:
        logger.info(f"[REQ] 메일 요약 요청 (길이={len(text)}자)")
        resp = client_ai.chat.completions.create(
            model="gpt-4o-mini", # AI 모델 선택
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )

        summary = resp.choices[0].message.content.strip()

        # 간단한 유효성 검증
        if not summary or len(summary) < 5:
            logger.warning("[WARN] OpenAI 응답 내용이 비정상적 (짧거나 없음)")
            return "요약 생성 실패: 응답이 비어 있습니다."

        # 로그 남기기
        summary_preview = re.sub(r"\s+", " ", summary)[:100]
        logger.info(f"[OK] 요약 성공 (응답 길이={len(summary)}): {summary_preview}")

        return summary

    except Exception as e:
        logger.error(f"[ERROR] OpenAI 요약 중 예외 발생: {e}", exc_info=True)
        return "요약 생성 중 오류가 발생했습니다."


def load_thread_map():
    if os.path.exists(THREAD_MAP_FILE):
        with open(THREAD_MAP_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_thread_map(data):
    with open(THREAD_MAP_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_sr_idx(text):
    match = re.search(r"\b(\d{9,})\b", text)
    return match.group(1) if match else None

def extract_first_link_from_html(html):
    try:
        match = re.search(r'href=["\'](.*?)["\']', html)
        if match:
            url = match.group(1)
            return url.replace("&amp;", "&")  # &amp; 변환
    except Exception as e:
        print("링크 추출 오류:", e)
    return None

def send_to_slack(subject, sender, request_url, summary=None, mail_type=None, sr_idx=None):
    """Slack Web API로 메일 알림 전송. 고객사답변이면 스레드로 달기"""

    attachments = [
        {
            "fallback": subject,
            "pretext": f"*메일 제목:* {subject}",
            "mrkdwn_in": ["text", "pretext"]
        }
    ]

    if summary:
        attachments[0]["fields"] = [
            {
                "title": "✨AI 요약 내용✨",
                "value": summary,
                "short": False
            }
        ]

    if request_url:
        attachments[0]["actions"] = [
            {
                "type": "button",
                "text": "요청 내역 확인하기",
                "url": request_url,
                "style": "primary"
            }
        ]

    try:
        thread_map = load_thread_map()
        thread_ts = None

        # 고객사답변이고 접수번호가 있으면 스레드로
        if mail_type == "고객사답변" and sr_idx and sr_idx in thread_map:
            thread_ts = thread_map[sr_idx]

        kwargs = {
            "channel": SLACK_CHANNEL,
            "attachments": attachments
        }
        if thread_ts:
            kwargs["thread_ts"] = thread_ts

        response = slack_client.chat_postMessage(**kwargs)

        # 문의접수면 ts 저장
        if mail_type == "문의접수" and sr_idx and response.get("ok"):
            thread_map[sr_idx] = response["ts"]
            save_thread_map(thread_map)
            print(f"[저장] 접수번호 {sr_idx} → ts {response['ts']}")

        print(f"Slack 전송 완료 (mail_type={mail_type}, sr_idx={sr_idx}, thread={bool(thread_ts)})")
        return True
    except Exception as e:
        print(f"Slack 전송 중 오류 발생: {e}")
        return False

ALLOWED_COMPANIES = [
    '신세계푸드', '신세계까사', '피에스케이', '스타벅스커피코리아', '보령제약', '롯데바이오로직스',
    '대원제약', '시몬느', '일진글로벌', '유베이스', '일동제약그룹', '휴니드테크놀러지스',
    '에이블씨엔씨', '디앤에이모터스', '유니드', '유니드비티플러스', '아주스틸', '제테마',
    '유비쿼스', '폴리미래', '직방', '동인기연', '포티투닷', '파마리서치', '에이치엠엠',
    '노루페인트', '어드밴텍케이알'
]
ALLOWED_DOMAINS = [
    'shinsegae', 'lotte', 'psk', 'starbucks', 'boryung', 'daewon', 'simone', 'iljin', 'ubase',
    'ildong', 'huneed', 'able', 'dna', 'unid', 'ajusteel', 'j-meta', 'ubiquoss', 'polymirae',
    'zigbang', 'dongin', '42dot', 'pharmaresearch', 'hmm21', 'dit', 'advantech'
]
KEYWORDS = ['문의접수', '고객사답변']

def normalize(text):
    return text.replace(" ", "").lower()

def should_forward(subject, sender):
    norm_subject = normalize(subject)
    norm_sender = normalize(sender)
    domain_part = norm_sender.split('@')[-1].split('.')[0].lower()

    # 조건 1: 키워드 + 고객사 이름이 모두 제목에 포함
    if any(normalize(k) in norm_subject for k in KEYWORDS) and \
       any(normalize(c) in norm_subject for c in ALLOWED_COMPANIES):
        return True

    # 조건 2: 보낸 사람 이메일 도메인이 허용 리스트에 포함
    if any(d in domain_part for d in ALLOWED_DOMAINS):
        return True

    return False

def fetch_and_forward():
    try:
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(EMAIL_USER, EMAIL_PASS)
        mail.select("inbox")

        status, messages = mail.search(None, '(UNSEEN)')
        if status != 'OK' or not messages[0]:
            print("새로운 메일 없음.")
            mail.logout()
            return

        for num in messages[0].split():
            status, data = mail.fetch(num, '(RFC822)')
            if status != 'OK':
                continue

            msg = email.message_from_bytes(data[0][1])
            subject, encoding = decode_header(msg.get("Subject"))[0]
            if isinstance(subject, bytes):
                subject = subject.decode(encoding or 'utf-8', errors='ignore')

            from_ = msg.get("From", "")
            from_email_match = re.search(r'<(.+?)>', from_)
            from_email = from_email_match.group(1) if from_email_match else from_

            # 본문 추출
            body = ""
            url = None
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if content_type == "text/plain" and "attachment" not in content_disposition:
                        try:
                            body = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors='ignore')
                        except:
                            pass
                    elif content_type == "text/html" and not url:
                        try:
                            html_content = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors='ignore')
                            body = html_content
                            url = extract_first_link_from_html(html_content)
                            if url and "114.unipost.co.kr" not in url:
                                url = None
                        except:
                            pass
            else:
                content_type = msg.get_content_type()
                if content_type == "text/plain":
                    body = msg.get_payload(decode=True).decode(msg.get_content_charset() or "utf-8", errors='ignore')
            
            # 필터링 조건 확인
            if not should_forward(subject, from_email):
                mail.store(num, '+FLAGS', '\\Seen')
                continue

            summary_text = summarize_email_with_openai(body)
            print(f"[요약결과] {summary_text}")

            # 메일 타입 판별 (문의접수 / 고객사답변)
            norm_subject = normalize(subject)
            if normalize("문의접수") in norm_subject:
                mail_type = "문의접수"
            elif normalize("고객사답변") in norm_subject:
                mail_type = "고객사답변"
            else:
                mail_type = None

            # 본문에서 접수번호 추출
            sr_idx = extract_sr_idx(body)
            print(f"[분류] mail_type={mail_type}, sr_idx={sr_idx}")

            # ✅ 슬랙으로 발송 (요약 포함)
            send_to_slack(subject, from_email, url, summary=summary_text, mail_type=mail_type, sr_idx=sr_idx)

            mail.store(num, '+FLAGS', '\\Seen')

        mail.logout()

    except Exception as e:
        print(f"메일 처리 중 오류 발생: {e}")

if __name__ == "__main__":
    while True:
        fetch_and_forward()
        time.sleep(5)
    
