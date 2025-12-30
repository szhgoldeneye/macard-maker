from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import io

from app.database import get_db
from app.models.card import CardHistory
from app.services.storage_service import upload_image, get_image_url
from app.middleware.auth import get_current_user

router = APIRouter()


class SaveCardRequest(BaseModel):
    image_data: str  # base64 编码的图片数据
    config: Optional[dict] = None
    blessing_text: Optional[str] = None


class SaveCardResponse(BaseModel):
    id: int
    image_url: str


@router.post("/save", response_model=SaveCardResponse)
async def save_card(
    request: SaveCardRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """保存贺卡到 OSS"""
    try:
        # 上传图片到 OSS
        image_url, thumbnail_url = await upload_image(
            request.image_data,
            user_id=current_user.id,
        )
        
        # 保存历史记录
        history = CardHistory(
            user_id=current_user.id,
            image_url=image_url,
            thumbnail_url=thumbnail_url,
            config=request.config,
            blessing_text=request.blessing_text,
        )
        db.add(history)
        await db.commit()
        await db.refresh(history)
        
        return SaveCardResponse(id=history.id, image_url=image_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存贺卡失败: {str(e)}")


@router.get("/download/{card_id}")
async def download_card(card_id: int, db: AsyncSession = Depends(get_db)):
    """下载贺卡"""
    from sqlalchemy import select
    
    result = await db.execute(select(CardHistory).where(CardHistory.id == card_id))
    card = result.scalar_one_or_none()
    
    if not card:
        raise HTTPException(status_code=404, detail="贺卡不存在")
    
    # 获取图片内容
    async with httpx.AsyncClient() as client:
        response = await client.get(card.image_url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="获取图片失败")
        
        return StreamingResponse(
            io.BytesIO(response.content),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=card_{card_id}.png"},
        )

