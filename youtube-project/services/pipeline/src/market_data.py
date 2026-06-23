import logging
import requests

logger = logging.getLogger(__name__)

INDICES = [
    {"name": "S&P 500",  "symbol": "%5EGSPC",  "prefix": ""},
    {"name": "나스닥",    "symbol": "%5EIXIC",  "prefix": ""},
    {"name": "다우존스",  "symbol": "%5EDJI",   "prefix": ""},
    {"name": "비트코인",  "symbol": "BTC-USD",  "prefix": "$"},
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept": "application/json",
}


def _fetch_ticker(symbol: str) -> dict | None:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"interval": "1d", "range": "5d"}
    try:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        closes = data["chart"]["result"][0]["indicators"]["quote"][0]["close"]
        closes = [c for c in closes if c is not None]
        if len(closes) < 2:
            return None
        return {"prev": closes[-2], "curr": closes[-1]}
    except Exception as e:
        logger.warning(f"{symbol} 조회 실패: {e}")
        return None


def fetch_indices() -> list[dict]:
    results = []
    for idx in INDICES:
        data = _fetch_ticker(idx["symbol"])
        if not data:
            continue
        prev, curr = data["prev"], data["curr"]
        change = curr - prev
        change_pct = (change / prev) * 100
        results.append({
            "name": idx["name"],
            "prev": prev,
            "price": curr,
            "change": change,
            "change_pct": change_pct,
            "prefix": idx["prefix"],
            "up": change >= 0,
        })
    logger.info(f"지수 {len(results)}개 조회 완료")
    return results


def format_price(price: float, prefix: str) -> str:
    if price >= 1000:
        return f"{prefix}{price:,.0f}"
    return f"{prefix}{price:,.2f}"


def format_change(change: float, change_pct: float, up: bool) -> str:
    arrow = "▲" if up else "▼"
    sign = "+" if up else ""
    return f"{arrow} {sign}{change_pct:.2f}%"
