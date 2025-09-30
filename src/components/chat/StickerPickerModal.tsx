import React, { useState } from 'react';
import { Modal } from 'react-native';
import StickerPicker from './StickerPicker';
import { StickerData } from '../../types/sticker';

interface StickerPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onStickerSelect: (sticker: StickerData) => void;
}

export const StickerPickerModal: React.FC<StickerPickerModalProps> = ({
  visible,
  onClose,
  onStickerSelect,
}) => {
  const handleStickerSelect = (sticker: StickerData) => {
    onStickerSelect(sticker);
    onClose();
  };

  return (
    <StickerPicker
      visible={visible}
      onClose={onClose}
      onStickerSelect={handleStickerSelect}
    />
  );
};

export default StickerPickerModal;