from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import fetch, generate, images, publish, refine, hugo
import uvicorn

load_dotenv()

app = FastAPI(title="Blog Auto API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fetch.router,    prefix="/api", tags=["Fetch"])
app.include_router(generate.router, prefix="/api", tags=["Generate"])
app.include_router(refine.router,   prefix="/api", tags=["Refine"])
app.include_router(images.router,   prefix="/api", tags=["Images"])
app.include_router(publish.router,  prefix="/api", tags=["Publish"])
app.include_router(hugo.router,    prefix="/api/hugo", tags=["Hugo"])


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
