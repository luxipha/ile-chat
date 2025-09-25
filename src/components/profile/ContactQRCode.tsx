import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Card } from '../ui/Card';

interface ContactQRCodeProps {
  userId: string;
  userName: string;
  size?: number;
}

export const ContactQRCode: React.FC<ContactQRCodeProps> = ({
  userId,
  userName,
  size = 200
}) => {
  // Generate QR code data for contact sharing
  const qrData = `contact:${userId}:${userName}`;

  return (
    <Card style={styles.container}>
      <Text style={styles.title}>My Contact QR Code</Text>
      <Text style={styles.subtitle}>
        Share this code with others to add you as a contact
      </Text>
      
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={size}
          backgroundColor={Colors.background}
          color={Colors.text}
        />
      </View>
      
      <Text style={styles.userName}>{userName}</Text>
      <Text style={styles.instructions}>
        Others can scan this code to send you a friend request
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  qrContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  userName: {
    ...Typography.h4,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  instructions: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
});