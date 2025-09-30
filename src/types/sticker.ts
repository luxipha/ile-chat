export interface StickerData {
  id: string;
  emoji?: string; // For emoji stickers
  name: string;
  category: string;
  // GIPHY sticker data
  url?: string;
  previewUrl?: string;
  width?: number;
  height?: number;
  title?: string;
}

export interface StickerMessage {
  type: 'sticker';
  sticker: StickerData;
  timestamp: Date;
}

export interface ExtendedChatMessage {
  _id: string;
  text?: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type: 'text' | 'payment' | 'attachment' | 'loan_request' | 'sticker';
  
  // Existing message data
  paymentData?: any;
  attachmentData?: any;
  loanData?: any;
  
  // New sticker data
  stickerData?: StickerData;
}

export interface StickerCategory {
  id: string;
  name: string;
  icon: string;
  stickers: StickerData[];
}