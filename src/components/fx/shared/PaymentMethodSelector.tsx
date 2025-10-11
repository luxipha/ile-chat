import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { PaymentMethod } from '../../../types/fx';

interface PaymentMethodDetails {
  alipay?: { accountName: string; phoneNumber: string };
  wechat?: {};
  bank?: { bankName: string; accountName: string; accountNumber: string };
}

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedPaymentMethods: PaymentMethod[];
  onPaymentMethodToggle: (method: PaymentMethod) => void;
  paymentMethodDetails: PaymentMethodDetails;
  onPaymentMethodDetailsChange: (details: PaymentMethodDetails) => void;
  title?: string;
  subtitle?: string;
  showAutoFilledBadge?: boolean;
  autoFilledMethods?: string[];
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods,
  selectedPaymentMethods,
  onPaymentMethodToggle,
  paymentMethodDetails,
  onPaymentMethodDetailsChange,
  title = "Payment Methods",
  subtitle = "Select payment methods you accept",
  showAutoFilledBadge = false,
  autoFilledMethods = [],
}) => {
  const updatePaymentMethodDetails = (
    methodId: string,
    field: string,
    value: string
  ) => {
    const updatedDetails = { ...paymentMethodDetails };
    
    if (methodId === 'alipay') {
      updatedDetails.alipay = {
        accountName: updatedDetails.alipay?.accountName || '',
        phoneNumber: updatedDetails.alipay?.phoneNumber || '',
        [field]: value,
      };
    } else if (methodId === 'bank') {
      updatedDetails.bank = {
        bankName: updatedDetails.bank?.bankName || '',
        accountName: updatedDetails.bank?.accountName || '',
        accountNumber: updatedDetails.bank?.accountNumber || '',
        [field]: value,
      };
    }
    
    onPaymentMethodDetailsChange(updatedDetails);
  };

  const renderPaymentMethodDetails = (method: PaymentMethod) => {
    const isAutoFilled = autoFilledMethods.includes(method.id);

    if (method.id === 'alipay') {
      return (
        <View style={styles.paymentDetailsSection}>
          <View style={styles.sectionHeader}>
            <Typography variant="h6" style={styles.detailsSectionTitle}>
              Alipay Details
            </Typography>
            {showAutoFilledBadge && isAutoFilled && (
              <View style={styles.autoFilledBadge}>
                <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                <Typography variant="caption" style={styles.autoFilledText}>
                  Auto-filled
                </Typography>
              </View>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Typography variant="body2" style={styles.inputLabel}>
              Account Name
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your Alipay account name"
              value={paymentMethodDetails.alipay?.accountName || ''}
              onChangeText={(text) => updatePaymentMethodDetails('alipay', 'accountName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Typography variant="body2" style={styles.inputLabel}>
              Phone Number
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your phone number"
              value={paymentMethodDetails.alipay?.phoneNumber || ''}
              onChangeText={(text) => updatePaymentMethodDetails('alipay', 'phoneNumber', text)}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      );
    }

    if (method.id === 'wechat') {
      return (
        <View style={styles.paymentDetailsSection}>
          <Typography variant="h6" style={styles.detailsSectionTitle}>
            WeChat Selected
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No additional details required for WeChat payments.
          </Typography>
        </View>
      );
    }

    if (method.id === 'bank') {
      return (
        <View style={styles.paymentDetailsSection}>
          <View style={styles.sectionHeader}>
            <Typography variant="h6" style={styles.detailsSectionTitle}>
              Bank Account Details
            </Typography>
            {showAutoFilledBadge && isAutoFilled && (
              <View style={styles.autoFilledBadge}>
                <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                <Typography variant="caption" style={styles.autoFilledText}>
                  Auto-filled
                </Typography>
              </View>
            )}
          </View>
          <View style={styles.inputGroup}>
            <Typography variant="body2" style={styles.inputLabel}>
              Bank Name
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="Enter bank name"
              value={paymentMethodDetails.bank?.bankName || ''}
              onChangeText={(text) => updatePaymentMethodDetails('bank', 'bankName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Typography variant="body2" style={styles.inputLabel}>
              Account Name
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="Enter account holder name"
              value={paymentMethodDetails.bank?.accountName || ''}
              onChangeText={(text) => updatePaymentMethodDetails('bank', 'accountName', text)}
            />
          </View>
          <View style={styles.inputGroup}>
            <Typography variant="body2" style={styles.inputLabel}>
              Account Number
            </Typography>
            <TextInput
              style={styles.textInput}
              placeholder="Enter account number"
              value={paymentMethodDetails.bank?.accountNumber || ''}
              onChangeText={(text) => updatePaymentMethodDetails('bank', 'accountNumber', text)}
              keyboardType="numeric"
            />
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <Typography variant="h5" style={styles.title}>{title}</Typography>
      <Typography variant="body2" color="textSecondary" style={styles.subtitle}>
        {subtitle}
      </Typography>
      
      {paymentMethods.map((method) => {
        const isSelected = selectedPaymentMethods.some(m => m.id === method.id);
        
        return (
          <View key={method.id}>
            <TouchableOpacity
              style={[
                styles.paymentMethodCard,
                isSelected && styles.selectedPaymentMethod
              ]}
              onPress={() => onPaymentMethodToggle(method)}
            >
              <View style={styles.paymentMethodHeader}>
                <MaterialIcons name={method.icon as any} size={24} color={Colors.primary} />
                <Typography variant="h6" style={styles.paymentMethodName}>
                  {method.name}
                </Typography>
                {isSelected && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                )}
              </View>
              <Typography variant="caption" color="textSecondary">
                {method.processingTime} • {method.limits.min} - {method.limits.max} limit
              </Typography>
            </TouchableOpacity>
            
            {/* Sliding input section for selected payment method */}
            {isSelected && renderPaymentMethodDetails(method)}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  paymentMethodCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginBottom: Spacing.md,
  },
  selectedPaymentMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  paymentMethodName: {
    marginLeft: Spacing.md,
    flex: 1,
    fontWeight: '600',
  },
  paymentDetailsSection: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailsSectionTitle: {
    marginBottom: 0,
    fontWeight: '600',
    color: Colors.primary,
  },
  autoFilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  autoFilledText: {
    marginLeft: Spacing.xs,
    color: Colors.success,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
});