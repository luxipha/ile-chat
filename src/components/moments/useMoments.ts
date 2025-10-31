import { useState, useEffect, useCallback } from 'react';
import { communityService } from '../../services/communityService';

interface UseMomentsProps {
  isActive: boolean;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  currentUserId?: string;
  onSetGeneralLoading?: (message: string) => void;
  onClearGeneralLoading?: () => void;
}

export const useMoments = ({
  isActive,
  isAuthenticated,
  isCheckingAuth,
  currentUserId,
  onSetGeneralLoading,
  onClearGeneralLoading,
}: UseMomentsProps) => {
  // State
  const [moments, setMoments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteMenu, setShowDeleteMenu] = useState<string | null>(null);

  // Load posts function
  const loadPosts = useCallback(async (isRefresh = false) => {
    console.log('📱 useMoments.loadPosts() called:', { 
      isRefresh, 
      isActive, 
      isAuthenticated, 
      isCheckingAuth,
      currentUserId 
    });
    
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      console.log('🔄 Calling communityService.getPosts(1, 20)...');
      const response = await communityService.getPosts(1, 20);
      console.log('📊 communityService.getPosts response:', {
        success: response.success,
        postsCount: response.data?.posts?.length || 0,
        error: response.error,
        hasCurrentUser: !!currentUserId
      });

      if (response.success && response.data?.posts) {
        const formattedPosts = response.data.posts.map(post =>
          communityService.formatPostForUI(post, currentUserId)
        );
        
        console.log('📝 Setting moments:', {
          totalPosts: formattedPosts.length,
          firstPostId: formattedPosts[0]?.id,
          firstPostAuthor: formattedPosts[0]?.authorName
        });
        
        setMoments(formattedPosts);
      } else {
        console.warn('⚠️ Failed to load posts:', response.error);
        if (!isRefresh) {
          setError(response.error || 'Failed to load posts');
        }
      }
    } catch (error) {
      console.error('❌ Error loading posts:', error);
      if (!isRefresh) {
        setError('Failed to load posts. Pull down to refresh.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUserId, isActive, isAuthenticated, isCheckingAuth]);

  // Load posts when tab becomes active and user is authenticated
  useEffect(() => {
    console.log('🔄 useMoments useEffect triggered:', {
      isActive,
      isAuthenticated,
      isCheckingAuth,
      shouldLoad: isActive && isAuthenticated && !isCheckingAuth
    });

    if (isActive && isAuthenticated && !isCheckingAuth) {
      loadPosts();
    } else if (isActive && !isAuthenticated && !isCheckingAuth) {
      console.log('🔒 User not authenticated, showing auth error');
      setError('Authentication required to view moments');
    }
  }, [isActive, isAuthenticated, isCheckingAuth, loadPosts]);

  // Handlers
  const handleLike = async (momentId: string) => {
    try {
      console.log('👍 handleLike called with momentId:', { momentId, type: typeof momentId });

      if (!momentId) {
        console.error('❌ momentId is undefined or null');
        return;
      }

      const response = await communityService.likePost(momentId);

      if (response.success) {
        setMoments(prev => prev.map(post => 
          post.id === momentId 
            ? { 
                ...post, 
                isLikedByUser: !post.isLikedByUser,
                isLiked: !post.isLiked,
                likes: post.isLikedByUser ? (post.likes || 1) - 1 : (post.likes || 0) + 1
              }
            : post
        ));
      }
    } catch (error) {
      console.error('❌ Error liking post:', error);
    }
  };

  const handleShare = async (momentId: string) => {
    try {
      const response = await communityService.sharePost(momentId);
      if (response.success) {
        setMoments(prev => prev.map(post => 
          post.id === momentId 
            ? { ...post, shares: (post.shares || 0) + 1 }
            : post
        ));
      }
    } catch (error) {
      console.error('❌ Error sharing post:', error);
    }
  };

  const handleDelete = async (momentId: string) => {
    try {
      const response = await communityService.deletePost(momentId);
      if (response.success) {
        setMoments(prev => prev.filter(post => post.id !== momentId));
        setShowDeleteMenu(null);
      }
    } catch (error) {
      console.error('❌ Error deleting post:', error);
    }
  };

  const handleDeleteMenuToggle = (momentId: string) => {
    setShowDeleteMenu(showDeleteMenu === momentId ? null : momentId);
  };

  const handleCreateMoment = async (content: string, image?: string) => {
    try {
      console.log('📝 useMoments.handleCreateMoment() called:', { content, hasImage: !!image, currentUserId });

      if (onSetGeneralLoading) {
        onSetGeneralLoading('Creating moment...');
      }

      console.log('🔄 Calling communityService.createPost...');

      const postData: any = {
        content: content.trim(),
        authorId: currentUserId,
        timestamp: new Date().toISOString(),
      };

      if (image) {
        postData.image = image;
        console.log('📸 Post includes image');
      }

      const response = await communityService.createPost(postData);

      console.log('📊 Create post response:', {
        success: response.success,
        error: response.error,
        hasPost: !!response.data,
        postId: response.data?.id || response.data?._id
      });

      if (response.success && response.data) {
        console.log('✅ Post created successfully:', {
          postId: response.data.id || response.data._id,
          content: response.data.content?.substring(0, 50) + '...',
          authorId: response.data.authorId,
        });

        const formattedPost = communityService.formatPostForUI(response.data, currentUserId);
        
        // Ensure the post has an ID - add fallback if needed
        if (!formattedPost.id && !formattedPost._id) {
          formattedPost.id = `temp_${Date.now()}_${Math.random()}`;
          console.warn('⚠️ Created temporary ID for new post:', formattedPost.id);
        }
        
        console.log('📝 Adding new post to moments list');
        console.log('🔍 Formatted post data:', {
          id: formattedPost.id,
          _id: formattedPost._id,
          authorName: formattedPost.authorName,
          content: formattedPost.content?.substring(0, 50) + '...'
        });

        setMoments(prev => [formattedPost, ...prev]);

        console.log('✅ handleCreateMoment completed successfully');
        return { success: true };
      } else {
        setError(response.error || 'Failed to create moment');
        throw new Error(response.error || 'Failed to create moment');
      }
    } catch (error) {
      console.error('❌ Error creating moment:', error);
      setError('Failed to create moment. Please try again.');
      throw error;
    } finally {
      if (onClearGeneralLoading) {
        onClearGeneralLoading();
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearMomentsData = () => {
    setMoments([]);
    setError(null);
  };

  return {
    // State
    moments,
    isLoading,
    isRefreshing,
    error,
    showDeleteMenu,

    // Actions
    loadPosts,
    handleLike,
    handleShare,
    handleDelete,
    handleDeleteMenuToggle,
    handleCreateMoment,
    clearError,
    clearMomentsData,
  };
};