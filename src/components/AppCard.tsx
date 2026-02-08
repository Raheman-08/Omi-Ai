import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AppCardProps {
  appIcon: ImageSourcePropType;
  title: string;
  category: string;
  rating?: number;
  reviews?: number;
  showExpandIcon?: boolean;
  onPress?: () => void;
  isPopularApp?: boolean;
}

const AppCard = ({
  appIcon,
  title,
  category,
  rating,
  reviews,
  showExpandIcon = false,
  onPress,
  isPopularApp = false,
}: AppCardProps) => {
  const renderRating = () => (
    <View style={styles.ratingContainer}>
      <Text style={styles.rating}>{rating}</Text>
      <Feather name="star" size={12} color="#7C3AED" style={styles.starIcon} />
      <Text style={styles.reviews}>({reviews})</Text>
    </View>
  );

  if (isPopularApp) {
    return (
      <TouchableOpacity
        style={styles.popularContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image source={appIcon} style={styles.appIcon} />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.category} numberOfLines={1}>{category}</Text>
        </View>
        {rating !== undefined && reviews !== undefined && renderRating()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={appIcon} style={styles.appIcon} />
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{category}</Text>
        {rating !== undefined && reviews !== undefined && renderRating()}
      </View>
      {showExpandIcon && (
        <Feather name="chevron-down" size={24} color="rgba(255,255,255,0.5)" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  popularContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  textContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  category: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 4,
  },
  starIcon: {
    marginRight: 4,
  },
  reviews: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
});

export default AppCard; 