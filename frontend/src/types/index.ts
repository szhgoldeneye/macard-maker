// 贺卡方向
export type CardOrientation = 'horizontal' | 'vertical';

// 宽高比
export type AspectRatio = '16:9' | '1:1' | '4:3';

// 贺卡配置
export interface CardConfig {
  orientation: CardOrientation;
  aspectRatio: AspectRatio;
  showBorder: boolean;
  showLogo: boolean;
  showQrCode: boolean;
}

// 贺卡状态
export interface CardState {
  config: CardConfig;
  blessingText: string;
  imageUrl: string | null;
  organizationName: string;
}

// 用户信息
export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
}

// 历史记录项
export interface HistoryItem {
  id: number;
  image_url: string;
  thumbnail_url: string | null;
  config: CardConfig | null;
  blessing_text: string | null;
  created_at: string;
}

// API 响应
export interface GenerateTextResponse {
  text: string;
}

export interface GenerateImageResponse {
  image_url: string;
}

export interface SaveCardResponse {
  id: number;
  image_url: string;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
}

