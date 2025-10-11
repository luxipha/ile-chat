import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../../ui/Typography';
import { Colors, Spacing, BorderRadius } from '../../../theme';
import { Currency } from '../../../types/fx';

interface CurrencySelectorProps {
  currencies: Currency[];
  sellCurrency: Currency | null;
  buyCurrency: Currency | null;
  onSellCurrencySelect: (currency: Currency) => void;
  onBuyCurrencySelect: (currency: Currency) => void;
  title?: string;
  sellLabel?: string;
  buyLabel?: string;
  showSwapButton?: boolean;
  onSwap?: () => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currencies,
  sellCurrency,
  buyCurrency,
  onSellCurrencySelect,
  onBuyCurrencySelect,
  title = "What do you want to trade?",
  sellLabel = "I want to sell:",
  buyLabel = "In exchange for:",
  showSwapButton = true,
  onSwap,
}) => {
  const handleSwap = () => {
    if (onSwap) {
      onSwap();
    } else {
      // Default swap behavior
      if (sellCurrency && buyCurrency) {
        onSellCurrencySelect(buyCurrency);
        onBuyCurrencySelect(sellCurrency);
      }
    }
  };

  const renderCurrencyOption = (
    currency: Currency,
    isSelected: boolean,
    onPress: (currency: Currency) => void
  ) => (
    <TouchableOpacity
      key={currency.code}
      style={[
        styles.currencyOption,
        isSelected && styles.selectedCurrency
      ]}
      onPress={() => onPress(currency)}
    >
      <Typography variant="h4" style={styles.currencyFlag}>
        {currency.flag}
      </Typography>
      <Typography variant="body2" style={styles.currencyCode}>
        {currency.code}
      </Typography>
      <Typography variant="caption" color="textSecondary">
        {currency.name}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {title && (
        <Typography variant="h5" style={styles.title}>
          {title}
        </Typography>
      )}
      
      <View style={styles.currencySelection}>
        <Typography variant="body1" style={styles.selectionLabel}>
          {sellLabel}
        </Typography>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.currencyList}
        >
          {currencies.map((currency) => 
            renderCurrencyOption(
              currency,
              sellCurrency?.code === currency.code,
              onSellCurrencySelect
            )
          )}
        </ScrollView>
      </View>

      {showSwapButton && (
        <View style={styles.exchangeArrow}>
          <TouchableOpacity onPress={handleSwap} style={styles.swapButton}>
            <MaterialIcons name="swap-vert" size={32} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.currencySelection}>
        <Typography variant="body1" style={styles.selectionLabel}>
          {buyLabel}
        </Typography>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.currencyList}
        >
          {currencies
            .filter(c => c.code !== sellCurrency?.code)
            .map((currency) => 
              renderCurrencyOption(
                currency,
                buyCurrency?.code === currency.code,
                onBuyCurrencySelect
              )
            )}
        </ScrollView>
      </View>
    </View>
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
  currencySelection: {
    marginBottom: Spacing.xl,
  },
  selectionLabel: {
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
  currencyList: {
    flexDirection: 'row',
  },
  currencyOption: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray200,
    marginRight: Spacing.md,
    minWidth: 100,
  },
  selectedCurrency: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  currencyFlag: {
    marginBottom: Spacing.sm,
  },
  currencyCode: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  exchangeArrow: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  swapButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary + '20',
  },
});