export interface StickerData {
  id: string;
  emoji?: string; // For emoji stickers
  name?: string;
  category?: string;
  // GIPHY sticker data
  url?: string;
  previewUrl?: string;
  preview_gif?: string; // GIPHY preview format
  width?: number;
  height?: number;
  title?: string;
  // Stipop sticker data
  type?: 'gif' | 'image' | 'emoji'; // Sticker type
  tags?: string[]; // Sticker tags
  artist?: string; // Artist name
  source?: 'giphy' | 'stipop' | 'emoji' | 'klipy'; // Sticker source
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