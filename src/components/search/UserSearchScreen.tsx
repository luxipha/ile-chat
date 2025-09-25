import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
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

interface UserSearchScreenProps {
  onBack: () => void;
  onUserSelect: (user: UserSearchResult) => void;
  title?: string;
}

export const UserSearchScreen: React.FC<UserSearchScreenProps> = ({
  onBack,
  onUserSelect,
  title = 'Search Users'
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      Alert.alert('Search Query Too Short', 'Please enter at least 3 characters to search.');
      return;
    }

    try {
      setLoading(true);
      const result = await friendService.searchUsers(query.trim());
      
      if (result.success) {
        setResults(result.users);
        setHasSearched(true);
      } else {
        Alert.alert('Search Error', 'Failed to search users. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Failed to search users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item: user }: { item: UserSearchResult }) => (
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Typography variant="h3">{title}</Typography>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={24} color={Colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, or username..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <MaterialIcons name="clear" size={20} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          onPress={handleSearch} 
          style={[styles.searchButton, query.trim().length < 3 && styles.searchButtonDisabled]}
          disabled={query.trim().length < 3 || loading}
        >
          {loading ? (
            <LoadingSpinner size="small" color={Colors.white} />
          ) : (
            <Typography variant="body1" style={styles.searchButtonText}>
              Search
            </Typography>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Hints */}
      <View style={styles.hintsContainer}>
        <Typography variant="caption" color="textSecondary" style={styles.hintText}>
          You can search by:
        </Typography>
        <View style={styles.hintTags}>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>Name</Typography>
          </View>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>Email</Typography>
          </View>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>Phone</Typography>
          </View>
          <View style={styles.hintTag}>
            <Typography variant="caption" style={styles.hintTagText}>Username</Typography>
          </View>
        </View>
      </View>

      {/* Results */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
            <Typography variant="body1" style={styles.loadingText}>
              Searching users...
            </Typography>
          </View>
        ) : hasSearched ? (
          results.length > 0 ? (
            <FlatList
              data={results}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
            />
          ) : (
            <EmptyState
              icon="person-search"
              title="No Users Found"
              message={`No users found for "${query}". Try searching with different terms.`}
            />
          )
        ) : (
          <EmptyState
            icon="search"
            title="Search for Users"
            message="Enter at least 3 characters to start searching for users by name, email, phone, or username."
          />
        )}
      </View>
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
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
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  searchButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  searchButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  hintsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.textSecondary,
  },
  resultsList: {
    paddingBottom: Spacing.xl,
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