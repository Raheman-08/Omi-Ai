import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import AppCard from '../../components/AppCard';

// Default placeholder image
const placeholderImage = require('../../assets/images/placeholder.jpg');

// Sample app data
const popularApps = [
  {
    id: '1',
    title: 'Google Drive',
    category: 'Productivity And Organization',
    rating: 4.9,
    reviews: 9,
    appIcon: placeholderImage,
  },
  {
    id: '2',
    title: 'Omi Mentor',
    category: 'Productivity And Organization',
    rating: 4.5,
    reviews: 8,
    appIcon: placeholderImage,
  },
  {
    id: '3',
    title: 'Translator',
    category: 'Utilities And Tools',
    rating: 4.4,
    reviews: 13,
    appIcon: placeholderImage,
  },
  {
    id: '4',
    title: 'Lie Detector Pro',
    category: 'Conversation Analysis',
    rating: 5.0,
    reviews: 4,
    appIcon: placeholderImage,
  },
  {
    id: '5',
    title: 'KOL - The Girlfriend Retainer',
    category: 'Social And Relationships',
    rating: 4.3,
    reviews: 16,
    appIcon: placeholderImage,
  },
  {
    id: '6',
    title: 'Programming Duck',
    category: 'Education And Learning',
    rating: 5.0,
    reviews: 4,
    appIcon: placeholderImage,
  },
];

const allApps = [
  {
    id: '1',
    title: 'Google Drive',
    category: 'Connect to Google Drive. Automatically sync OMI Memories and/or Transcripts',
    rating: 4.9,
    reviews: 9,
    appIcon: placeholderImage,
  },
  {
    id: '2',
    title: 'Omi Translator',
    category: 'Translate to the language you want! Using LLM to translate texts mentioned!',
    rating: 4.4,
    reviews: 13,
    appIcon: placeholderImage,
  },
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.loadingIcon}>
          <Icon name="loader" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Explore</Text>
      <TouchableOpacity style={styles.profileButton}>
        <View style={styles.profileIcon}>
          <Icon name="user" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TouchableOpacity style={styles.filterButton}>
        <Icon name="filter" size={18} color="#FFFFFF" />
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
      <Icon name="plus" size={24} color="#FFFFFF" />
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
        >
          {renderCreateCard()}
          <Text style={styles.sectionTitle}>Popular Apps</Text>
          <View style={styles.popularAppsContainer}>
            {popularApps.map(app => (
              <AppCard
                key={app.id}
                appIcon={app.appIcon}
                title={app.title}
                category={app.category}
                rating={app.rating}
                reviews={app.reviews}
                isPopularApp
              />
            ))}
          </View>
          <Text style={styles.sectionTitle}>All Apps</Text>
          {allApps.map(app => (
            <AppCard
              key={app.id}
              appIcon={app.appIcon}
              title={app.title}
              category={app.category}
              rating={app.rating}
              reviews={app.reviews}
              showExpandIcon
            />
          ))}
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
});

export default Explore;