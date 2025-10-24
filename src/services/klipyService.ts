/**
 * Klipy Sticker Service
 * Handles integration with Klipy API for free GIF stickers, stickers, and clips
 * API Documentation: https://api.klipy.com
 */

const KLIPY_API_BASE = 'https://api.klipy.com';
const KLIPY_API_KEY = 'obaQMsPcGNi3MLsGKJTmNOgnZV7hKRA3BgoSBef8e2Oz4EVyHZ0EQFUdDmQmS051';

export interface KlipyGif {
  id: number;
  slug: string;
  title: string;
  tags: string[];
  type: string;
  blur_preview: string;
  file: {
    hd: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
    md: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
    sm: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
    xs: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
  };
}

export interface KlipySticker {
  id: number;
  slug: string;
  title: string;
  tags: string[];
  type: string;
  blur_preview: string;
  file: {
    hd: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
    md: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
    sm: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
    xs: {
      gif: { url: string; width: number; height: number; size: number };
      webp: { url: string; width: number; height: number; size: number };
      jpg: { url: string; width: number; height: number; size: number };
      mp4: { url: string; width: number; height: number; size: number };
      webm: { url: string; width: number; height: number; size: number };
    };
  };
}

export interface KlipyClip {
  id: number;
  slug: string;
  title: string;
  tags: string[];
  type: string;
  blur_preview?: string;
  url: string;
  file: {
    gif: string;
    mp4: string;
    webp: string;
  };
  file_meta: {
    gif: { width: number; height: number; size: number };
    mp4: { width: number; height: number; size: number };
    webp: { width: number; height: number; size: number };
  };
}

export interface KlipyStickerCategory {
  category: string;
  query: string;
  preview_url: string;
}

export interface KlipyClipCategory {
  category: string;
  query: string;
  preview_url: string;
}

export interface KlipyCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  gif_count?: number;
}

export interface KlipyTag {
  id: string;
  name: string;
  slug: string;
  gif_count?: number;
}

export interface KlipyApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  message?: string;
}

class KlipyService {
  private customerId: string = 'default-user';

  /**
   * Set customer ID for tracking user interactions
   */
  setCustomerId(customerId: string): void {
    this.customerId = customerId;
  }

  /**
   * Get trending GIFs
   */
  async getTrendingGifs(page: number = 1, perPage: number = 20): Promise<KlipyGif[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/trending?page=${page}&per_page=${perPage}&customer_id=${this.customerId}&locale=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.result && data.data && data.data.data) {
        const gifs = data.data.data;
        return gifs;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to get trending GIFs:', error);
      return [];
    }
  }

  /**
   * Search GIFs by query
   */
  async searchGifs(query: string, page: number = 1, perPage: number = 20): Promise<KlipyGif[]> {
    try {
      
      const encodedQuery = encodeURIComponent(query);
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/search?page=${page}&per_page=${perPage}&q=${encodedQuery}&customer_id=${this.customerId}&locale=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.result && data.data && data.data.data) {
        return data.data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to search GIFs:', error);
      return [];
    }
  }

  /**
   * Get available categories
   */
  async getCategories(locale: string = 'en'): Promise<KlipyCategory[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/categories?locale=${locale}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<KlipyCategory[]> = await response.json();

      if (data.success && data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Get available tags
   */
  async getTags(): Promise<KlipyTag[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/tags?customer_id=${this.customerId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<KlipyTag[]> = await response.json();

      if (data.success && data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to get tags:', error);
      return [];
    }
  }

  /**
   * Get recent GIFs for a customer
   */
  async getRecentGifs(page: number = 1, perPage: number = 20): Promise<KlipyGif[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/recent/${this.customerId}?page=${page}&per_page=${perPage}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<KlipyGif[]> = await response.json();

      if (data.success && data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to get recent GIFs:', error);
      return [];
    }
  }

  /**
   * Get GIFs by IDs or slugs
   */
  async getGifsByIds(ids?: string[], slugs?: string[]): Promise<KlipyGif[]> {
    try {
      
      const params = new URLSearchParams();
      if (ids && ids.length > 0) {
        params.append('ids', ids.join(','));
      }
      if (slugs && slugs.length > 0) {
        params.append('slugs', slugs.join(','));
      }

      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/items?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<KlipyGif[]> = await response.json();

      if (data.success && data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to get GIFs by IDs:', error);
      return [];
    }
  }

  /**
   * Share a GIF (track usage)
   */
  async shareGif(slug: string): Promise<boolean> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/share/${slug}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: this.customerId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<any> = await response.json();

      return data.success;
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to share GIF:', error);
      return false;
    }
  }

  /**
   * Remove a GIF from recent list
   */
  async removeFromRecent(slug: string): Promise<boolean> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/recent/${this.customerId}?slug=${slug}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<any> = await response.json();

      return data.success;
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to remove from recent:', error);
      return false;
    }
  }

  /**
   * Report a GIF
   */
  async reportGif(slug: string, reason?: string): Promise<boolean> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/gifs/report/${slug}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: this.customerId,
          reason: reason || 'inappropriate',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: KlipyApiResponse<any> = await response.json();

      return data.success;
    } catch (error) {
      console.error('🎭 [KlipyService] Failed to report GIF:', error);
      return false;
    }
  }

  /**
   * Get sticker categories
   */
  async getStickerCategories(): Promise<KlipyStickerCategory[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/stickers/categories?customer_id=${this.customerId}&locale=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.result && data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Error getting sticker categories:', error);
      return [];
    }
  }

  /**
   * Get clip categories
   */
  async getClipCategories(): Promise<KlipyClipCategory[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/clips/categories?customer_id=${this.customerId}&locale=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.result && data.data) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Error getting clip categories:', error);
      return [];
    }
  }

  /**
   * Get stickers by category
   */
  async getStickers(category: string, page: number = 1, perPage: number = 20): Promise<KlipySticker[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/stickers/search?q=${encodeURIComponent(category)}&page=${page}&per_page=${perPage}&customer_id=${this.customerId}&locale=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.result && data.data && data.data.data) {
        const stickers = data.data.data;
        return stickers;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Error getting stickers:', error);
      return [];
    }
  }

  /**
   * Get clips by category
   */
  async getClips(category: string, page: number = 1, perPage: number = 20): Promise<KlipyClip[]> {
    try {
      
      const url = `${KLIPY_API_BASE}/api/v1/${KLIPY_API_KEY}/clips/search?q=${encodeURIComponent(category)}&page=${page}&per_page=${perPage}&customer_id=${this.customerId}&locale=en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (data.result && data.data && data.data.data) {
        const clips = data.data.data;
        return clips;
      }

      return [];
    } catch (error) {
      console.error('🎭 [KlipyService] Error getting clips:', error);
      return [];
    }
  }

  /**
   * Get customer ID
   */
  getCustomerId(): string {
    return this.customerId;
  }
}

// Export singleton instance
export const klipyService = new KlipyService();
export default klipyService;