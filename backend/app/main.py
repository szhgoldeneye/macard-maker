from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import FRONTEND_URL
from app.database import init_db
from app.api import auth, ai, card, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="贺卡制作工具 API", lifespan=lifespan)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI生成"])
app.include_router(card.router, prefix="/api/card", tags=["贺卡"])
app.include_router(history.router, prefix="/api/history", tags=["历史记录"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

