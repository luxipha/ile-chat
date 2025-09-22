import React from 'react';
import { Modal } from 'react-native';
import { QRScanner } from './QRScanner';

interface QRScannerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onQRCodeScanned: (data: string) => void;
  title?: string;
  description?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isVisible,
  onClose,
  onQRCodeScanned,
  title,
  description,
}) => {
  const handleQRCodeScanned = (data: string) => {
    onQRCodeScanned(data);
    onClose(); // Close modal after successful scan
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
    >
      <QRScanner
        onBack={onClose}
        onQRCodeScanned={handleQRCodeScanned}
        title={title}
        description={description}
      />
    </Modal>
  );
};