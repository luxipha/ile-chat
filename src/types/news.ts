export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  source: string;
  sourceId?: string;
  category?: string;
  publishedAt: string;
  url: string | null;
}

export interface NewsCategory {
  id: string;
  label: string;
}
