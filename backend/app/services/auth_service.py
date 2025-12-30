from jose import jwt, JWTError
from datetime import datetime
from typing import Optional

from app.config import SECRET_KEY

ALGORITHM = "HS256"


def decode_token(token: str) -> Optional[dict]:
    """解码 JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> Optional[int]:
    """验证 token 并返回用户 ID"""
    payload = decode_token(token)
    if not payload:
        return None
    
    # 检查过期时间
    exp = payload.get("exp")
    if exp and datetime.utcnow().timestamp() > exp:
        return None
    
    return payload.get("user_id")

