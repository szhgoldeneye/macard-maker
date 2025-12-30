from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base


class CardHistory(Base):
    __tablename__ = "card_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    image_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    config = Column(JSON, nullable=True)  # 存储贺卡配置（宽高比、显示选项等）
    blessing_text = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

