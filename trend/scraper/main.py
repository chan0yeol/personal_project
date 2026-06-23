from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routers import google_trends, naver_news, naver_datalab, naver_realtime, google_search_console, tistory_publisher, groq_generate, wordpress_publisher
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Trend Scraper API",
    description="Google Trends & Naver News & Search Console & Tistory Scraper",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(google_trends.router, prefix="/collect", tags=["Google Trends"])
app.include_router(naver_realtime.router, prefix="/collect", tags=["Naver Realtime"])
app.include_router(naver_news.router, prefix="/collect", tags=["Naver News"])
app.include_router(naver_datalab.router, prefix="/collect", tags=["Naver DataLab"])
app.include_router(google_search_console.router, prefix="/collect", tags=["Google Search Console"])
app.include_router(tistory_publisher.router, prefix="/publish", tags=["Tistory Publisher"])
app.include_router(groq_generate.router, prefix="/generate", tags=["Groq Generate"])
app.include_router(wordpress_publisher.router, prefix="/publish", tags=["WordPress Publisher"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "trend-scraper"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)