from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.database import get_db
from app.models.card import CardHistory
from app.middleware.auth import get_current_user
from app.services.storage_service import delete_image

router = APIRouter()


class HistoryItem(BaseModel):
    id: int
    image_url: str
    thumbnail_url: Optional[str]
    config: Optional[dict]
    blessing_text: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class HistoryListResponse(BaseModel):
    items: List[HistoryItem]
    total: int


@router.get("", response_model=HistoryListResponse)
async def get_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """获取当前用户的历史记录列表"""
    # 查询总数
    from sqlalchemy import func
    count_result = await db.execute(
        select(func.count()).select_from(CardHistory).where(CardHistory.user_id == current_user.id)
    )
    total = count_result.scalar()
    
    # 查询列表
    result = await db.execute(
        select(CardHistory)
        .where(CardHistory.user_id == current_user.id)
        .order_by(CardHistory.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    
    return HistoryListResponse(
        items=[HistoryItem.model_validate(item) for item in items],
        total=total,
    )


@router.get("/{history_id}", response_model=HistoryItem)
async def get_history_item(
    history_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """获取单个历史记录详情"""
    result = await db.execute(
        select(CardHistory).where(
            CardHistory.id == history_id,
            CardHistory.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="历史记录不存在")
    
    return HistoryItem.model_validate(item)


@router.delete("/{history_id}")
async def delete_history_item(
    history_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """删除历史记录"""
    result = await db.execute(
        select(CardHistory).where(
            CardHistory.id == history_id,
            CardHistory.user_id == current_user.id,
        )
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="历史记录不存在")
    
    # 删除 OSS 上的图片
    try:
        await delete_image(item.image_url)
        if item.thumbnail_url:
            await delete_image(item.thumbnail_url)
    except Exception:
        pass  # 忽略删除 OSS 图片的错误
    
    # 删除数据库记录
    await db.execute(delete(CardHistory).where(CardHistory.id == history_id))
    await db.commit()
    
    return {"message": "删除成功"}

