from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
from jose import jwt
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.middleware.auth import get_current_user
from app.config import (
    OAUTH2_CLIENT_ID,
    OAUTH2_CLIENT_SECRET,
    OAUTH2_AUTHORIZATION_URL,
    OAUTH2_TOKEN_URL,
    OAUTH2_USERINFO_URL,
    OAUTH2_REDIRECT_URI,
    SECRET_KEY,
    FRONTEND_URL,
)

router = APIRouter()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.get("/login")
async def login():
    """跳转到 OAuth2 登录页面"""
    params = {
        "client_id": OAUTH2_CLIENT_ID,
        "redirect_uri": OAUTH2_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid profile email",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{OAUTH2_AUTHORIZATION_URL}?{query}")


@router.get("/callback")
async def callback(code: str, db: AsyncSession = Depends(get_db)):
    """OAuth2 回调处理"""
    # 用授权码换取 access_token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            OAUTH2_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": OAUTH2_REDIRECT_URI,
                "client_id": OAUTH2_CLIENT_ID,
                "client_secret": OAUTH2_CLIENT_SECRET,
            },
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="获取 token 失败")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        # 获取用户信息
        userinfo_response = await client.get(
            OAUTH2_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="获取用户信息失败")
        
        userinfo = userinfo_response.json()
    
    # 查找或创建用户
    oauth_id = userinfo.get("sub") or userinfo.get("id")
    result = await db.execute(select(User).where(User.oauth_id == str(oauth_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            oauth_id=str(oauth_id),
            username=userinfo.get("name") or userinfo.get("username"),
            email=userinfo.get("email"),
            avatar=userinfo.get("picture") or userinfo.get("avatar"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # 创建 JWT token
    token = create_access_token({"user_id": user.id, "oauth_id": user.oauth_id})
    
    # 重定向到前端并设置 token
    response = RedirectResponse(url=f"{FRONTEND_URL}?token={token}")
    return response


@router.get("/logout")
async def logout():
    """登出"""
    response = RedirectResponse(url=FRONTEND_URL)
    return response


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "avatar": current_user.avatar,
    }
