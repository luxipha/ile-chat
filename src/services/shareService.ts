import { Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
  type?: 'text' | 'media' | 'profile' | 'qr';
  customPreview?: any; // React ref for custom preview capture
  dialogTitle?: string;
}

class ShareService {
  async shareContent(options: ShareOptions) {
    try {
      let shareOptions: any = {
        title: options.title,
        message: options.message,
        dialogTitle: options.dialogTitle,
      };

      // If there's a custom preview component, capture it
      if (options.customPreview) {
        const uri = await captureRef(options.customPreview, {
          format: 'png',
          quality: 1.0
        });
        shareOptions.url = uri;
      } else if (options.url) {
        shareOptions.url = options.url;
      }

      // Platform-specific options
      if (Platform.OS === 'ios') {
        shareOptions.activityItemSources = [
          {
            placeholderItem: { type: 'text', content: options.message },
            item: {
              default: { type: 'text', content: options.message },
            },
            linkMetadata: {
              title: options.title || 'Share',
              icon: options.url
            },
          },
        ];
      }

      const result = await Share.share(shareOptions, {
        dialogTitle: options.dialogTitle || 'Share',
        subject: options.title,
      });

      if (result.action === Share.sharedAction) {
        return { success: true, shared: true };
      } else if (result.action === Share.dismissedAction) {
        return { success: true, shared: false };
      }

      return { success: true, shared: true };
    } catch (error) {
      console.error('Error sharing content:', error);
      return { success: false, error };
    }
  }

  // Helper methods for specific share types
  async shareText(message: string, title?: string) {
    return this.shareContent({
      type: 'text',
      message,
      title,
    });
  }

  async shareMedia(mediaUrl: string, message: string, title?: string) {
    return this.shareContent({
      type: 'media',
      message,
      url: mediaUrl,
      title,
    });
  }

  async shareProfile(profileName: string, profileId: string, customPreview?: any) {
    return this.shareContent({
      type: 'profile',
      message: `Connect with ${profileName} on ilePay!`,
      title: 'Share Profile',
      customPreview,
    });
  }

  async shareQRCode(qrType: 'profile' | 'payment', userName: string, qrData: string, customPreview: any) {
    const typeText = qrType === 'profile' ? 'Profile' : 'Payment';
    return this.shareContent({
      type: 'qr',
      message: `Connect with ${userName} on ilePay! Scan this QR code to ${qrType === 'profile' ? 'view profile' : 'send payment'}: ${qrData}`,
      title: `My ilePay ${typeText} QR Code`,
      customPreview,
    });
  }
}

export default new ShareService();