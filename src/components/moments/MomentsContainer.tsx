import React, { useState } from 'react';
import { MomentsScreen } from './MomentsScreen';
import { CreateMomentModal } from './CreateMomentModal';
import { useMoments } from './useMoments';

interface MomentsContainerProps {
  isActive: boolean;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  onSetGeneralLoading?: (message: string) => void;
  onClearGeneralLoading?: () => void;
}

export const MomentsContainer: React.FC<MomentsContainerProps> = ({
  isActive,
  isAuthenticated,
  isCheckingAuth,
  currentUser,
  onSetGeneralLoading,
  onClearGeneralLoading,
}) => {
  const [showCreateMoment, setShowCreateMoment] = useState(false);

  const {
    moments,
    isLoading,
    isRefreshing,
    error,
    showDeleteMenu,
    loadPosts,
    handleLike,
    handleShare,
    handleDelete,
    handleDeleteMenuToggle,
    handleCreateMoment,
    clearError,
  } = useMoments({
    isActive,
    isAuthenticated,
    isCheckingAuth,
    currentUserId: currentUser?.id,
    onSetGeneralLoading,
    onClearGeneralLoading,
  });

  const onCreateMoment = () => {
    setShowCreateMoment(true);
  };

  const onCreateMomentSubmit = async (content: string, image?: string) => {
    try {
      await handleCreateMoment(content, image);
      setShowCreateMoment(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <>
      <MomentsScreen
        moments={moments}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        error={error}
        currentUserId={currentUser?.id}
        showDeleteMenu={showDeleteMenu}
        onRefresh={() => loadPosts(true)}
        onCreateMoment={onCreateMoment}
        onLike={handleLike}
        onShare={handleShare}
        onDeleteMenuToggle={handleDeleteMenuToggle}
        onDelete={handleDelete}
        onClearError={clearError}
      />

      {/* Create Moment Modal */}
      <CreateMomentModal
        isVisible={showCreateMoment}
        onClose={() => setShowCreateMoment(false)}
        onCreateMoment={onCreateMomentSubmit}
        currentUser={currentUser}
      />
    </>
  );
};