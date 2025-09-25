import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { Colors, Spacing, BorderRadius } from '../../theme';
import friendService from '../../services/friendService';

interface UserSearchResult {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  username?: string;
  avatar?: string;
}

interface AddContactScreenProps {
  onBack: () => void;
  onUserSelect: (user: UserSearchResult) => void;
  onOpenQRScanner: () => void;
}

export const AddContactScreen: React.FC<AddContactScreenProps> = ({
  onBack,
  onUserSelect,
  onOpenQRScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) {
      Alert.alert('Search Query Too Short', 'Please enter at least 3 characters to search.');
      return;
    }

    try {
      setSearching(true);
      const result = await friendService.searchUsers(searchQuery.trim());
      
      if (result.success) {
        setSearchResults(result.users);
        setHasSearched(true);
      } else {
        Alert.alert('Search Error', 'Failed to search users. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const renderSearchResult = ({ item: user }: { item: UserSearchResult }) => (
    <TouchableOpacity onPress={() => onUserSelect(user)}>
      <Card style={styles.userCard}>
        <View style={styles.userRow}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Typography variant="h6" style={styles.avatarText}>
                  {user.name.charAt(0).toUpperCase()}
                </Typography>
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Typography variant="h6" style={styles.userName}>
              {user.name}
            </Typography>
            {user.email && (
              <Typography variant="body2" color="textSecondary">
                {user.email}
              </Typography>
            )}
            {user.phone && (
              <Typography variant="body2" color="textSecondary">
                {user.phone}
              </Typography>
            )}
            {user.username && (
              <Typography variant="body2" color="primary">
                @{user.username}
              </Typography>
            )}
          </View>
          
          <MaterialIcons name="chevron-right" size={24} color={Colors.gray400} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Typography variant="h6" style={styles.sectionTitle}>
        Add Contact
      </Typography>
      
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={onOpenQRScanner}>
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="qr-code-scanner" size={32} color={Colors.primary} />
          </View>
          <Typography variant="body2" style={styles.quickActionText}>
            Scan QR Code
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => {
            // Focus the search input
            setSearchQuery('');
            setHasSearched(false);
            setSearchResults([]);
          }}
        >
          <View style={styles.quickActionIcon}>
            <MaterialIcons name="search" size={32} color={Colors.primary} />
          </View>
          <Typography variant="body2" style={styles.quickActionText}>
            Search Users
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <Typography variant="h6" style={styles.sectionTitle}>
        Search by Phone, Email, or Username
      </Typography>
      
      {/* Search Input */}
      <View style={styles.searchInputContainer}>
        <MaterialIcons name="search" size={24} color={Colors.gray400} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Enter phone, email, or username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <MaterialIcons name="clear" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        )}
      </View>
      
      <Button 
        title={searching ? "Searching..." : "Search"}
        onPress={handleSearch}
        disabled={searchQuery.trim().length < 3 || searching}
        style={styles.searchButton}
      />

      {/* Search Hints */}
      <View style={styles.hintsContainer}>
        <Typography variant="caption" color="textSecondary" style={styles.hintText}>
          Search examples:
        </Typography>
        <View style={styles.hintTags}>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>john@email.com</Typography>
          </View>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>+234801234567</Typography>
          </View>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>@username</Typography>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSearchResults = () => {
    if (searching) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Typography variant="body1" style={styles.loadingText}>
            Searching users...
          </Typography>
        </View>
      );
    }

    if (hasSearched) {
      if (searchResults.length > 0) {
        return (
          <View style={styles.resultsContainer}>
            <Typography variant="h6" style={styles.sectionTitle}>
              Search Results ({searchResults.length})
            </Typography>
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Let the parent ScrollView handle scrolling
            />
          </View>
        );
      } else {
        return (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="person-search"
              title="No Users Found"
              message={`No users found for "${searchQuery}". Try different search terms.`}
            />
          </View>
        );
      }
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Typography variant="h3">Add Contact</Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderQuickActions()}
        {renderSearchSection()}
        {renderSearchResults()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  quickActionsContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  quickActionIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  quickActionText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  searchSection: {
    marginBottom: Spacing.xl,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  searchButton: {
    marginBottom: Spacing.md,
  },
  hintsContainer: {
    marginTop: Spacing.sm,
  },
  hintText: {
    marginBottom: Spacing.sm,
  },
  hintTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  hintTag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  hintTagText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  resultsContainer: {
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
  },
  userCard: {
    marginBottom: Spacing.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
});