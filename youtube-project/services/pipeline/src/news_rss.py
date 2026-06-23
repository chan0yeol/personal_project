import logging
import feedparser

logger = logging.getLogger(__name__)

# 미국 금융/증시 RSS 피드
RSS_FEEDS = [
    "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",  # CNBC Markets
    "https://feeds.marketwatch.com/marketwatch/topstories/",                                   # MarketWatch
    "https://feeds.reuters.com/reuters/businessNews",                                          # Reuters Business
]


def fetch_top_news(count: int = 10) -> list[dict]:
    articles = []

    for url in RSS_FEEDS:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries:
                title = entry.get("title", "").strip()
                summary = entry.get("summary", entry.get("description", "")).strip()
                if title and len(title) > 5:
                    articles.append({"title": title, "summary": summary[:300]})
                if len(articles) >= count * 2:
                    break
        except Exception as e:
            logger.warning(f"RSS 수집 실패 ({url}): {e}")

    seen = set()
    unique = []
    for a in articles:
        if a["title"] not in seen:
            seen.add(a["title"])
            unique.append(a)

    logger.info(f"미국장 뉴스 {len(unique)}건 수집 완료")
    return unique[:count]
