# AI 贺卡制作工具

一个简单好用的 AI 贺卡生成器，点击即可生成专属贺卡图片。

## 功能

- 🎲 **幸运生成器**：一键生成 AI 图片
- ✍️ **祝福语**：支持自动生成或手动编辑
- 🖼️ **多种版式**：横版/竖版、16:9/4:3/1:1
- 📄 **拍立得风格**：可开关相纸边框、学校标志、分享码
- 💾 **自动云存储**：下载时自动保存到云端
- 📜 **历史记录**：查看和管理已生成的贺卡

## 快速开始

### 后端

```bash
cd backend
cp env-example.txt .env  # 编辑配置
pip install -r requirements.txt
python run.py
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173
