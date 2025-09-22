import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { Colors, Spacing, BorderRadius } from '../../theme';
import { MaterialIcons } from '@expo/vector-icons';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContent}>
            <MaterialIcons name="error-outline" size={64} color={Colors.error} />
            <Typography variant="h5" style={styles.errorTitle}>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body1" color="textSecondary" style={styles.errorMessage}>
              We encountered an unexpected error. Please try again.
            </Typography>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Typography variant="body2" style={styles.errorDetailsTitle}>
                  Error Details (Development):
                </Typography>
                <Typography variant="caption" style={styles.errorDetailsText}>
                  {this.state.error.toString()}
                </Typography>
              </View>
            )}

            <Button
              title="Try Again"
              onPress={this.handleRetry}
              style={styles.retryButton}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  errorDetails: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorDetailsTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: Colors.error,
  },
  errorDetailsText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: Colors.gray600,
  },
  retryButton: {
    minWidth: 120,
  },
});