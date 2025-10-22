import { apiClient } from './api';
import { NewsArticle } from '../types';

interface NewsServiceResponse {
  articles: NewsArticle[];
  error?: string;
  cached?: boolean;
  fetchedAt?: string;
  hasMore?: boolean;
  totalAvailable?: number;
  offset?: number;
}

interface NewsArticleContent {
  title: string;
  content: string;
  textContent: string;
  excerpt: string;
  byline?: string;
  length?: number;
  siteName?: string;
  images: string[];
}

class NewsService {
  async getArticles(limit: number = 40, offset: number = 0): Promise<NewsServiceResponse> {
    try {
      const response = await apiClient.get('/api/news', {
        params: {
          limit,
          offset,
        },
      });

      const payload: any = response?.data ?? response;
      const articles = Array.isArray(payload?.articles) ? payload.articles : [];

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch news articles');
      }

      return {
        articles,
        error: response.success ? undefined : response.error,
        cached: payload?.meta?.cached,
        fetchedAt: payload?.meta?.fetchedAt,
        hasMore: payload?.meta?.hasMore,
        totalAvailable: payload?.meta?.totalAvailable,
        offset: payload?.meta?.offset,
      };
    } catch (error) {
      console.error('Failed to load news articles:', error);

      const message =
        error instanceof Error ? error.message : 'Unable to load news articles';

      throw new Error(message);
    }
  }

  async getArticleContent(url: string): Promise<NewsArticleContent> {
    if (!url) {
      throw new Error('Missing article URL');
    }

    try {
      const response = await apiClient.get('/api/news/content', {
        params: { url },
      });

      const payload: any = response?.data ?? response;

      if (!response.success) {
        throw new Error(response.error || 'Failed to load article content');
      }

      if (!payload?.article) {
        throw new Error('Article content unavailable');
      }

      return payload.article as NewsArticleContent;
    } catch (error) {
      console.error('Failed to fetch article content:', error);
      const message =
        error instanceof Error ? error.message : 'Unable to load article content';
      throw new Error(message);
    }
  }
}

const newsService = new NewsService();

export default newsService;
export { newsService };
export type { NewsArticleContent, NewsServiceResponse };
