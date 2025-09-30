const GIPHY_API_KEY = 'BekCGuDFEcf1oVqYIjHI52BLVGMsNqti';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1';

export interface GiphySticker {
  id: string;
  title: string;
  images: {
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    downsized: {
      url: string;
      width: string;
      height: string;
    };
    preview_gif: {
      url: string;
      width: string;
      height: string;
    };
  };
}

export interface GiphyResponse {
  data: GiphySticker[];
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

class GiphyService {
  /**
   * Get trending stickers
   */
  async getTrendingStickers(limit: number = 25, offset: number = 0): Promise<GiphySticker[]> {
    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/stickers/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status}`);
      }
      
      const data: GiphyResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching trending stickers:', error);
      throw error;
    }
  }

  /**
   * Search for stickers
   */
  async searchStickers(query: string, limit: number = 25, offset: number = 0): Promise<GiphySticker[]> {
    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`GIPHY API error: ${response.status}`);
      }
      
      const data: GiphyResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error searching stickers:', error);
      throw error;
    }
  }

  /**
   * Get popular search terms for stickers
   */
  getPopularStickerCategories(): string[] {
    return [
      'happy',
      'love',
      'excited',
      'thumbs up',
      'party',
      'celebration',
      'heart',
      'funny',
      'cute',
      'cool',
      'awesome',
      'good job',
      'thank you',
      'sorry',
      'yes',
      'no'
    ];
  }

  /**
   * Format sticker for chat message
   */
  formatStickerForMessage(sticker: GiphySticker): {
    id: string;
    title: string;
    url: string;
    previewUrl: string;
    width: number;
    height: number;
  } {
    return {
      id: sticker.id,
      title: sticker.title,
      url: sticker.images.fixed_height_small.url,
      previewUrl: sticker.images.preview_gif.url,
      width: parseInt(sticker.images.fixed_height_small.width),
      height: parseInt(sticker.images.fixed_height_small.height),
    };
  }
}

export default new GiphyService();