import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getAppDetails, enableApp, disableApp, appImageUrl } from '../../api/apps';
import type { ServerApp } from '../../api/types';

const placeholderImage = require('../../assets/images/placeholder.jpg');

export type AppDetailsParams = { appId: string; app?: ServerApp };

const AppDetails = () => {
  const route = useRoute<RouteProp<{ AppDetails: AppDetailsParams }, 'AppDetails'>>();
  const navigation = useNavigation();
  const { appId, app: initialApp } = route.params;

  const [app, setApp] = useState<ServerApp | null>(initialApp ?? null);
  const [loading, setLoading] = useState(!initialApp);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const details = await getAppDetails(appId);
      setApp(details);
      if (!details) setError('App not found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load app');
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleInstall = useCallback(async () => {
    if (!appId) return;
    setActionLoading(true);
    try {
      const ok = await enableApp(appId);
      if (ok) {
        setApp((prev) => (prev ? { ...prev, enabled: true } : null));
      } else {
        Alert.alert('Install failed', 'Could not install this app. Please try again.');
      }
    } catch {
      Alert.alert('Install failed', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  }, [appId]);

  const handleUninstall = useCallback(async () => {
    if (!appId) return;
    Alert.alert(
      'Uninstall app',
      `Disable "${app?.name ?? 'this app'}"? You can install it again later.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Uninstall',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const ok = await disableApp(appId);
              if (ok) {
                setApp((prev) => (prev ? { ...prev, enabled: false } : null));
              } else {
                Alert.alert('Uninstall failed', 'Could not uninstall. Please try again.');
              }
            } catch {
              Alert.alert('Uninstall failed', 'Something went wrong. Please try again.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  }, [appId, app?.name]);

  const goBack = () => navigation.goBack();

  const imageSource = app?.image && appImageUrl(app) ? { uri: appImageUrl(app) } : placeholderImage;
  const enabled = app?.enabled ?? false;

  if (loading && !app) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#000000', '#111111']} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="rgba(255,255,255,0.8)" />
          <Text style={styles.loadingText}>Loading app…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !app) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#000000', '#111111']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadDetails} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#111111']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{app?.name ?? 'App'}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image source={imageSource} style={styles.icon} />
          <Text style={styles.name}>{app?.name ?? ''}</Text>
          {app?.author ? (
            <Text style={styles.author}>by {app.author}</Text>
          ) : null}
          {(app?.rating_avg != null || (app?.rating_count != null && app.rating_count > 0)) && (
            <View style={styles.ratingRow}>
              <Feather name="star" size={16} color="#7C3AED" />
              <Text style={styles.ratingText}>
                {app?.rating_avg != null ? Number(app.rating_avg).toFixed(1) : '—'} ({app?.rating_count ?? 0} reviews)
              </Text>
            </View>
          )}
          {app?.category ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{app.category}</Text>
            </View>
          ) : null}
        </View>
        {app?.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{app.description}</Text>
          </View>
        ) : null}
        <View style={styles.actions}>
          {enabled ? (
            <TouchableOpacity
              style={[styles.primaryButton, styles.uninstallButton]}
              onPress={handleUninstall}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Installed</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleInstall}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="download" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Install</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(124,58,237,0.8)',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  author: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  actions: {
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 14,
  },
  uninstallButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AppDetails;
