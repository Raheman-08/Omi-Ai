import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AppCard from '../../components/AppCard';
import { getPopularApps, getAppsSearch, appImageUrl } from '../../api/apps';
import type { ServerApp } from '../../api/types';
import type { RootStackParamList } from '../../navigation/StackNavigation';

const placeholderImage = require('../../assets/images/placeholder.jpg');

const Explore = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [popularApps, setPopularApps] = useState<ServerApp[]>([]);
  const [allApps, setAllApps] = useState<ServerApp[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPopular = useCallback(async () => {
    setLoadingPopular(true);
    setError(null);
    try {
      const list = await getPopularApps();
      setPopularApps(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load popular apps');
      setPopularApps([]);
    } finally {
      setLoadingPopular(false);
    }
  }, []);

  const loadAllApps = useCallback(async (q?: string) => {
    if (q !== undefined) setSearchLoading(!!q?.trim());
    else setLoadingAll(true);
    setError(null);
    try {
      const { data } = await getAppsSearch({
        q: q?.trim() || undefined,
        limit: 50,
        offset: 0,
      });
      if (q !== undefined) {
        setAllApps(data);
      } else {
        setAllApps(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load apps');
      setAllApps([]);
    } finally {
      if (q !== undefined) setSearchLoading(false);
      else setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    loadPopular();
  }, [loadPopular]);

  useEffect(() => {
    loadAllApps();
  }, [loadAllApps]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      loadAllApps();
      return;
    }
    const t = setTimeout(() => loadAllApps(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery, loadAllApps]);

  const onRefresh = useCallback(() => {
    loadPopular();
    loadAllApps(searchQuery.trim() || undefined);
  }, [loadPopular, loadAllApps, searchQuery]);

  const appIcon = (app: ServerApp) => {
    const uri = app.image ? appImageUrl(app) : '';
    return uri ? { uri } : placeholderImage;
  };

  const openAppDetails = (app: ServerApp) => {
    navigation.navigate('AppDetails', { appId: app.id, app });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.loadingIcon}>
          <Feather name="loader" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Explore</Text>
      <TouchableOpacity style={styles.profileButton}>
        <View style={styles.profileIcon}>
          <Feather name="user" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TouchableOpacity style={styles.filterButton}>
        <Feather name="filter" size={18} color="#FFFFFF" />
        <Text style={styles.filterText}>Filter</Text>
      </TouchableOpacity>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Apps"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const renderCreateCard = () => (
    <TouchableOpacity style={styles.createCard} activeOpacity={0.7}>
      <Feather name="plus" size={24} color="#FFFFFF" />
      <Text style={styles.createText}>Create your own</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#000000', '#111111']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        {renderHeader()}
        {renderSearchBar()}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loadingPopular && loadingAll && !searchLoading}
              onRefresh={onRefresh}
              tintColor="rgba(255,255,255,0.7)"
            />
          }
        >
          {renderCreateCard()}
          <Text style={styles.sectionTitle}>Popular Apps</Text>
          {error && !loadingPopular ? (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={onRefresh}>
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {loadingPopular ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              <Text style={styles.loadingText}>Loading popular apps…</Text>
            </View>
          ) : (
            <View style={styles.popularAppsContainer}>
              {popularApps.map((app) => (
                <AppCard
                  key={app.id}
                  appIcon={appIcon(app)}
                  title={app.name}
                  category={app.category ?? 'App'}
                  rating={app.rating_avg}
                  reviews={app.rating_count ?? 0}
                  isPopularApp
                  onPress={() => openAppDetails(app)}
                />
              ))}
            </View>
          )}
          <Text style={styles.sectionTitle}>All Apps</Text>
          {searchLoading || loadingAll ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              <Text style={styles.loadingText}>{searchQuery.trim() ? 'Searching…' : 'Loading apps…'}</Text>
            </View>
          ) : (
            <>
              {allApps.map((app) => (
                <AppCard
                  key={app.id}
                  appIcon={appIcon(app)}
                  title={app.name}
                  category={app.description ?? app.category ?? 'App'}
                  rating={app.rating_avg}
                  reviews={app.rating_count ?? 0}
                  showExpandIcon
                  onPress={() => openAppDetails(app)}
                />
              ))}
              {allApps.length === 0 && !error ? (
                <Text style={styles.emptyText}>No apps found</Text>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 60,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 8,
  },
  searchInputContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#FFFFFF',
    fontSize: 17,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  popularAppsContainer: {
    marginBottom: 24,
  },
  createCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  createText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  errorRow: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  retryText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginLeft: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    paddingVertical: 24,
  },
});

export default Explore;