import { Colors, Spacing, BorderRadius, Typography, Shadows } from './index';

// FX Colors Configuration
export const FXColors = {
  text: {
    primary: Colors.textPrimary,
    secondary: Colors.gray600,
    muted: Colors.gray500,
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning,
  },
  background: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    success: Colors.success,
    error: Colors.error,
    warning: Colors.warning,
    muted: Colors.gray100,
  },
  border: {
    default: Colors.gray200,
    muted: Colors.gray100,
    primary: Colors.primary,
  },
  primary: Colors.primary,
  surface: Colors.white,
  warning: Colors.warning,
  error: Colors.error,
};

// FX-specific theme styles for reusability
export const FXTheme = {
  // Common container styles
  containers: {
    screen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
    },
    filters: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: Colors.gray50,
      borderBottomWidth: 1,
      borderBottomColor: Colors.gray200,
    },
  },

  // Header styles
  headers: {
    main: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    withBorder: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.gray200,
    },
    content: {
      flex: 1,
    },
  },

  // Button styles
  buttons: {
    back: {
      padding: 8,
      marginRight: 16,
    },
    icon: {
      padding: 8,
    },
    create: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: FXColors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    action: {
      backgroundColor: FXColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    primary: {
      backgroundColor: FXColors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    secondary: {
      backgroundColor: FXColors.surface,
      borderWidth: 1,
      borderColor: FXColors.border.default,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    active: {
      backgroundColor: FXColors.primary,
      borderColor: FXColors.primary,
    },
    retry: {
      backgroundColor: FXColors.error,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    debug: {
      backgroundColor: FXColors.warning,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    createOffer: {
      backgroundColor: FXColors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },

  // Input and search styles
  inputs: {
    container: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: Colors.gray100,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
    },
    searchInput: {
      flex: 1,
      paddingVertical: Spacing.md,
      marginLeft: Spacing.sm,
    },
  },

  // Card styles
  cards: {
    base: {
      marginBottom: Spacing.md,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    inactive: {
      opacity: 0.7,
    },
    stat: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginRight: Spacing.sm,
      minWidth: 90,
      maxHeight: 50,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },

  // Currency and exchange styles
  currency: {
    pair: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: Spacing.lg,
    },
    side: {
      flex: 1,
    },
    sideRight: {
      flex: 1,
      alignItems: 'flex-end' as const,
    },
    info: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: Spacing.xs,
    },
    flag: {
      marginRight: Spacing.sm,
    },
    exchangeInfo: {
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.md,
    },
  },

  // Text styles
  text: {
    amount: {
      fontWeight: '600' as const,
    },
    rate: {
      marginVertical: Spacing.xs,
      fontWeight: '600' as const,
    },
    currencyCode: {
      fontWeight: '600' as const,
    },
    amountPrimary: {
      fontWeight: '600' as const,
      color: Colors.primary,
      marginVertical: Spacing.xs,
    },
    secondary: {
      color: Colors.gray600,
    },
    bold: {
      fontWeight: '600' as const,
    },
  },

  // Badge styles
  badges: {
    status: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.sm,
      alignSelf: 'flex-start' as const,
    },
    margin: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    method: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      backgroundColor: Colors.primary + '10',
      borderRadius: BorderRadius.sm,
    },
  },

  // Layout styles
  layouts: {
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    rowBetween: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    rowGap: {
      flexDirection: 'row' as const,
      gap: Spacing.sm,
    },
    column: {
      flexDirection: 'column' as const,
    },
    center: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    centerHorizontal: {
      alignItems: 'center' as const,
    },
  },

  // Progress and utilization styles
  progress: {
    container: {
      marginBottom: Spacing.md,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: Spacing.xs,
    },
    bar: {
      height: 4,
      backgroundColor: Colors.gray200,
      borderRadius: BorderRadius.sm,
      overflow: 'hidden' as const,
    },
    fill: {
      height: '100%' as const,
      borderRadius: BorderRadius.sm,
    },
  },

  // Payment method styles
  payment: {
    methods: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.md,
    },
    methodsList: {
      flexDirection: 'row' as const,
      marginLeft: Spacing.sm,
      gap: Spacing.sm,
    },
    methodText: {
      marginLeft: Spacing.xs / 2,
      color: Colors.primary,
      fontWeight: '500' as const,
      fontSize: 10,
    },
  },

  // Trade terms and limits
  trade: {
    terms: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.gray200,
    },
    termItem: {
      alignItems: 'center' as const,
    },
    limits: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    limitItem: {
      alignItems: 'center' as const,
    },
    limitValue: {
      fontWeight: '600' as const,
    },
  },

  // State styles (loading, error, empty)
  states: {
    loading: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: Spacing.xl * 2,
    },
    error: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.xl * 2,
    },
    empty: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl * 2,
    },
    loadingText: {
      marginTop: Spacing.md,
      color: Colors.gray600,
    },
    errorTitle: {
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
      textAlign: 'center' as const,
    },
    errorText: {
      textAlign: 'center' as const,
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      marginVertical: Spacing.md,
    },
    emptyText: {
      textAlign: 'center' as const,
      marginBottom: Spacing.lg,
    },
  },

  // Stats and performance styles
  stats: {
    container: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      maxHeight: 60,
    },
    grid: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    item: {
      alignItems: 'center' as const,
    },
    label: {
      fontSize: 10,
      marginBottom: 2,
      textAlign: 'center' as const,
    },
    value: {
      fontSize: 14,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
  },

  // Tab navigation styles
  tabs: {
    navigation: {
      flexDirection: 'row' as const,
      backgroundColor: Colors.gray100,
      borderRadius: BorderRadius.md,
      padding: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.sm,
      alignItems: 'center' as const,
    },
    activeTab: {
      backgroundColor: Colors.white,
      ...Shadows.sm,
    },
    tabText: {
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.weights.medium as any,
      color: Colors.gray600,
    },
    activeTabText: {
      color: Colors.primary,
      fontWeight: Typography.weights.semibold as any,
    },
  },

  // Spacing utilities
  spacing: {
    marginTop: (size: keyof typeof Spacing) => ({ marginTop: Spacing[size] }),
    marginBottom: (size: keyof typeof Spacing) => ({ marginBottom: Spacing[size] }),
    marginVertical: (size: keyof typeof Spacing) => ({ marginVertical: Spacing[size] }),
    marginHorizontal: (size: keyof typeof Spacing) => ({ marginHorizontal: Spacing[size] }),
    padding: (size: keyof typeof Spacing) => ({ padding: Spacing[size] }),
    paddingVertical: (size: keyof typeof Spacing) => ({ paddingVertical: Spacing[size] }),
    paddingHorizontal: (size: keyof typeof Spacing) => ({ paddingHorizontal: Spacing[size] }),
  },

  // Modal styles
  modals: {
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.lg,
    },
    content: {
      backgroundColor: Colors.white,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      maxWidth: 400,
      width: '100%' as const,
    },
    header: {
      alignItems: 'center' as const,
      marginBottom: Spacing.lg,
    },
    title: {
      marginTop: Spacing.md,
      textAlign: 'center' as const,
    },
    body: {
      marginBottom: Spacing.lg,
    },
    text: {
      textAlign: 'center' as const,
      marginBottom: Spacing.lg,
      color: Colors.gray600,
    },
    requirementsList: {
      marginBottom: Spacing.lg,
    },
    requirementItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: Spacing.sm,
    },
    requirementText: {
      marginLeft: Spacing.sm,
      color: Colors.gray700,
    },
    actions: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      gap: Spacing.md,
    },
    actionButton: {
       flex: 1,
     },
     subtext: {
       textAlign: 'center' as const,
       marginBottom: Spacing.lg,
       color: Colors.gray500,
       fontSize: 14,
     },
     buttons: {
       flexDirection: 'row' as const,
       justifyContent: 'space-between' as const,
       gap: Spacing.md,
     },
     primaryButton: {
       flex: 1,
       backgroundColor: FXColors.primary,
       paddingVertical: Spacing.md,
       borderRadius: BorderRadius.md,
       alignItems: 'center' as const,
       justifyContent: 'center' as const,
     },
     secondaryButton: {
       flex: 1,
       backgroundColor: Colors.gray100,
       paddingVertical: Spacing.md,
       borderRadius: BorderRadius.md,
       alignItems: 'center' as const,
       justifyContent: 'center' as const,
       borderWidth: 1,
       borderColor: Colors.gray300,
     },
  },
};