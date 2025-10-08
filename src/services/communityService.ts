import { apiClient } from './api';

export interface CommunityPost {
  _id: string;
  id: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  authorId: string;
  authorName: string;
  avatar?: string;
  content: string;
  image?: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  likedBy: string[];
  isLikedByUser?: boolean;
  trending: boolean;
  createdAt: string;
  updatedAt: string;
  time?: string;
}

export interface CreatePostData {
  content: string;
  image?: string;
}

export interface Comment {
  _id: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  content: string;
  likes: number;
  likedBy: string[];
  parentComment?: string;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PostsResponse {
  posts: CommunityPost[];
  total: number;
  page: number;
  pages: number;
  hasNext: boolean;
}

export interface TrendingTopic {
  hashtag: string;
  count: number;
  growth: number;
}

export interface TopContributor {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  score: number;
  badge: string;
  postsCount: number;
  commentsCount: number;
  likesReceived: number;
}

class CommunityService {
  async getPosts(page = 1, limit = 20, search?: string, retryCount = 0): Promise<CommunityResponse<PostsResponse>> {
    try {
      console.log(`📱 CommunityService.getPosts(page=${page}, limit=${limit}, search=${search}, retry=${retryCount})`);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      
      const response = await apiClient.get(`/api/community/posts?${params}`);
      
      if (!response.success && response.error && typeof response.error === 'object' && response.error !== null && 'isTimeout' in response.error && (response.error as any).isTimeout && retryCount < 2) {
        // Implement exponential backoff for retries
        const delay = (retryCount + 1) * 1000; // 1s, then 2s
        console.log(`⏱️ Timeout detected, retrying in ${delay}ms (attempt ${retryCount + 1}/2)...`);
        
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(this.getPosts(page, limit, search, retryCount + 1));
          }, delay);
        });
      }
      
      return {
        success: response.success,
        data: response.data ?? { 
          posts: [], 
          total: 0, 
          page: 1, 
          pages: 0, 
          hasNext: false 
        },
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ Failed to get posts:', error);
      return {
        success: false,
        data: { 
          posts: [], 
          total: 0, 
          page: 1, 
          pages: 0, 
          hasNext: false 
        },
        error: error.message || 'Failed to get posts'
      };
    }
  }

  async createPost(data: CreatePostData): Promise<CommunityResponse<CommunityPost>> {
    try {
      console.log('📝 CommunityService.createPost() called with:', {
        content: data.content,
        hasImage: !!data.image,
        imageSize: data.image ? data.image.length : 0
      });

      let requestData: any = data;

      // Use FormData for ALL image uploads (both web and mobile)
      if (data.image && data.image.startsWith('data:')) {
        console.log('📷 Converting to FormData for better image handling...');
        
        const formData = new FormData();
        formData.append('content', data.content);
        
        // Convert base64 to blob
        const blob = this.dataURLToBlob(data.image);
        formData.append('image', blob, 'image.jpg');
        
        requestData = formData;
        console.log('✅ FormData created with image blob');
      } else if (data.image) {
        console.log('📱 Non-base64 image, using JSON');
        requestData = data;
      } else {
        console.log('📝 Text-only post, using JSON');
        requestData = data;
      }

      const response = await apiClient.post('/api/community/posts', requestData);
      console.log('� Create post API response:', {
        success: response.success,
        error: response.error,
        hasData: !!response.data
      });
      
      return {
        success: response.success,
        data: response.data ?? {
          _id: '',
          id: '',
          author: {
            _id: '',
            name: '',
            email: ''
          },
          authorId: '',
          authorName: '',
          content: '',
          hashtags: [],
          likes: 0,
          comments: 0,
          shares: 0,
          likedBy: [],
          trending: false,
          createdAt: '',
          updatedAt: ''
        },
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ Failed to create post:', error);
      console.error('❌ Create post error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        data: {
          _id: '',
          id: '',
          author: {
            _id: '',
            name: '',
            email: ''
          },
          authorId: '',
          authorName: '',
          content: '',
          hashtags: [],
          likes: 0,
          comments: 0,
          shares: 0,
          likedBy: [],
          trending: false,
          createdAt: '',
          updatedAt: ''
        },
        error: error.message || 'Failed to create post'
      };
    }
  }

  async likePost(postId: string): Promise<CommunityResponse<{ isLiked: boolean; likes: number }>> {
    try {
      console.log('👍 CommunityService.likePost() called with postId:', postId);
      const response = await apiClient.post(`/api/community/posts/${postId}/like`);
      console.log('📥 Like API response:', {
        success: response.success,
        error: response.error,
        hasData: !!response.data
      });
      return {
        success: response.success,
        data: response.data ?? {
          isLiked: false,
          likes: 0
        },
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ Failed to like post:', error);
      return {
        success: false,
        data: { isLiked: false, likes: 0 },
        error: error.message || 'Failed to like post'
      };
    }
  }

  async sharePost(postId: string): Promise<CommunityResponse<{ shares: number }>> {
    try {
      console.log('🔄 CommunityService.sharePost() called with postId:', postId);
      const response = await apiClient.post(`/api/community/posts/${postId}/share`);
      console.log('📥 Share API response:', {
        success: response.success,
        error: response.error,
        hasData: !!response.data
      });
      return {
        success: response.success,
        data: response.data ?? {
          shares: 0
        },
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ Failed to share post:', error);
      return {
        success: false,
        data: { shares: 0 },
        error: error.message || 'Failed to share post'
      };
    }
  }

  async getComments(postId: string, page = 1, limit = 20): Promise<CommunityResponse<{ comments: Comment[]; total: number; page: number; pages: number }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await apiClient.get(`/api/community/posts/${postId}/comments?${params}`);
      return {
        success: response.success,
        data: response.data ?? { comments: [], total: 0, page: 1, pages: 0 },
        error: response.error
      };
    } catch (error: any) {
      console.error('Failed to get comments:', error);
      return {
        success: false,
        data: { comments: [], total: 0, page: 1, pages: 0 },
        error: error.message || 'Failed to get comments'
      };
    }
  }

  async createComment(postId: string, content: string): Promise<CommunityResponse<Comment>> {
    try {
      const response = await apiClient.post(`/api/community/posts/${postId}/comments`, { content });
      return {
        success: response.success,
        data: response.data ?? {
          _id: '',
          author: {
            _id: '',
            name: '',
            email: ''
          },
          content: '',
          likes: 0,
          likedBy: [],
          replies: [],
          createdAt: '',
          updatedAt: ''
        },
        error: response.error
      };
    } catch (error: any) {
      console.error('Failed to create comment:', error);
      return {
        success: false,
        data: {
          _id: '',
          author: {
            _id: '',
            name: '',
            email: ''
          },
          content: '',
          likes: 0,
          likedBy: [],
          replies: [],
          createdAt: '',
          updatedAt: ''
        },
        error: error.message || 'Failed to create comment'
      };
    }
  }

  async getTrendingTopics(): Promise<CommunityResponse<TrendingTopic[]>> {
    try {
      const response = await apiClient.get('/api/community/topics/trending');
      return {
        success: response.success,
        data: response.data ?? [],
        error: response.error
      };
    } catch (error: any) {
      console.error('Failed to get trending topics:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get trending topics'
      };
    }
  }

  async getTopContributors(): Promise<CommunityResponse<TopContributor[]>> {
    try {
      const response = await apiClient.get('/api/community/contributors/top');
      return {
        success: response.success,
        data: response.data ?? [],
        error: response.error
      };
    } catch (error: any) {
      console.error('Failed to get top contributors:', error);
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get top contributors'
      };
    }
  }

  async deletePost(postId: string): Promise<CommunityResponse<{ deleted: boolean }>> {
    try {
      console.log('🗑️ CommunityService.deletePost() called with postId:', postId);
      const response = await apiClient.delete(`/api/community/posts/${postId}`);
      console.log('📥 Delete API response:', {
        success: response.success,
        error: response.error,
        hasData: !!response.data
      });
      return {
        success: response.success,
        data: response.data ?? { deleted: true },
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ Failed to delete post:', error);
      console.error('❌ Delete error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        data: { deleted: false },
        error: error.message || 'Failed to delete post'
      };
    }
  }

  /**
   * Get posts by a specific user
   */
  async getUserPosts(userId: string, page = 1, limit = 10): Promise<CommunityResponse<PostsResponse>> {
    try {
      console.log('👤 CommunityService.getUserPosts() called with userId:', userId, 'page:', page);
      const response = await apiClient.get(`/api/community/posts/user/${userId}`, {
        params: { page, limit }
      });
      
      console.log('📥 User posts API response:', {
        success: response.success,
        hasData: !!response.data
      });
      
      // Handle the nested data structure from backend
      const responseData = response.data?.data || response.data || {};
      
      // Transform the data to match our expected format
      const posts = (responseData.posts || []).map((post: any) => ({
        ...post,
        id: post._id,
        authorId: post.author?._id || post.authorId,
        authorName: post.author?.name || post.authorName,
        time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown'
      }));

      return {
        success: response.success,
        data: {
          posts: posts,
          total: responseData.total ?? 0,
          page: responseData.page ?? page,
          pages: responseData.pages ?? 1,
          hasNext: responseData.hasNext ?? false
        },
        error: response.error
      };
    } catch (error: any) {
      console.error('❌ Failed to fetch user posts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user posts',
        data: { posts: [], total: 0, page: 1, pages: 0, hasNext: false }
      };
    }
  }

  // Utility function to format posts for the UI
  formatPostForUI(post: CommunityPost, currentUserId?: string): CommunityPost {
    console.log('🔄 Formatting post for UI:', {
      postId: post._id || post.id,
      authorName: post.author?.name,
      authorNameFallback: post.authorName,
      hasAuthor: !!post.author,
      authorKeys: post.author ? Object.keys(post.author) : null,
      hasImage: !!post.image,
      imageSize: post.image ? post.image.length : 0,
      // Don't log full rawPost as it might be huge with base64 images
      postKeys: Object.keys(post)
    });
    
    // Try multiple fallbacks for author name
    let authorName = 'Unknown User';
    if (post.author?.name) {
      authorName = post.author.name;
    } else if (post.authorName) {
      authorName = post.authorName;
    } else if (post.author?.email) {
      // Use email as fallback
      authorName = post.author.email.split('@')[0];
    }
    
    return {
      ...post,
      id: post._id || post.id,
      authorName: authorName,
      authorId: post.author?._id || post.authorId,
      avatar: post.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=007bff&color=fff`,
      isLikedByUser: currentUserId ? post.likedBy?.includes(currentUserId) : false,
      time: this.formatTimeAgo(new Date(post.createdAt))
    };
  }

  // Utility function to format time ago
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  // Helper method to convert data URL to blob
  private dataURLToBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
}

export const communityService = new CommunityService();