from openai import AsyncOpenAI
import aiohttp
from typing import Optional

from app.config import (
    AI_TEXT_API_URL,
    AI_TEXT_API_KEY,
    AI_IMAGE_API_URL,
    AI_IMAGE_API_KEY,
    AI_TEXT_MODEL,
    IMAGE_PROMPT,
    BLESSING_SYSTEM_PROMPT,
)

# 初始化 OpenAI 客户端（指向自托管服务）
text_client = AsyncOpenAI(
    base_url=AI_TEXT_API_URL,
    api_key=AI_TEXT_API_KEY,
)


async def generate_blessing_text(prompt: Optional[str] = None) -> str:
    """生成祝福语文本"""
    user_prompt = prompt or "请生成一条新年祝福语"
    
    response = await text_client.chat.completions.create(
        model=AI_TEXT_MODEL,
        messages=[
            {"role": "system", "content": BLESSING_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=100,
        temperature=0.8,
    )
    
    return response.choices[0].message.content.strip()


async def generate_image(prompt: Optional[str], width: int = 512, height: int = 512) -> str:
    """
    调用文生图 API 生成图片
    
    提示词从 .env 配置读取，前端传入的 prompt 会被忽略
    """
    async with aiohttp.ClientSession() as session:
        headers = {}
        if AI_IMAGE_API_KEY:
            headers["Authorization"] = f"Bearer {AI_IMAGE_API_KEY}"
        
        payload = {
            "prompt": IMAGE_PROMPT,
            "width": width,
            "height": height,
        }
        
        async with session.post(AI_IMAGE_API_URL, json=payload, headers=headers) as response:
            if response.status != 200:
                error_text = await response.text()
                raise Exception(f"图片生成失败: {error_text}")
            
            result = await response.json()
            # 支持多种返回格式
            if "image_url" in result:
                return result["image_url"]
            elif "url" in result:
                return result["url"]
            elif "data" in result and len(result["data"]) > 0:
                return result["data"][0].get("url") or result["data"][0].get("b64_json")
            else:
                raise Exception("图片生成返回格式异常")
