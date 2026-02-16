import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/Colors';
import { API_BASE_URL } from '../../config/api';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReadings = async () => {
    try {
      const response = await fetch('${API_BASE_URL}/glucose');
      const data = await response.json();

      // Handle both response formats
      const readingsArray = data.readings || data;
      setReadings(readingsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching readings:', error);
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReadings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const deleteReading = (id) => {
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this reading?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/glucose/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                await fetchReadings();
                Alert.alert('Deleted', 'Reading deleted successfully');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reading');
            }
          },
        },
      ]
    );
  };

  const getGlucoseColor = (value) => {
    if (value >= 70 && value <= 180) return '#14B8A6';
    if (value >= 55 && value < 70) return '#6B7280';
    if (value > 180 && value <= 250) return '#6B7280';
    return '#374151';
  };

  const getGlucoseStatus = (value) => {
    if (value >= 70 && value <= 180) return 'In range ✓';
    if (value >= 55 && value < 70) return 'Getting low ⚠️';
    if (value > 180 && value <= 250) return 'A bit high ⚠️';
    if (value < 55) return 'Very low! 🚨';
    return 'Very high! 🚨';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const readingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (readingDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (readingDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const groupReadingsByDate = () => {
    const grouped = {};
    readings.forEach((reading) => {
      const timestamp = reading.reading_time || reading.timestamp;
      const dateKey = formatDate(timestamp);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(reading);
    });
    return grouped;
  };

  const groupedReadings = groupReadingsByDate();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={styles.loadingText}>Loading your readings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (readings.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>History</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No readings yet</Text>
          <Text style={styles.emptyText}>
            Tap the + button to log your first glucose reading!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSubtitle}>{readings.length} total readings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#14B8A6']}
            tintColor="#14B8A6"
          />
        }
      >
        {Object.entries(groupedReadings).map(([date, dateReadings]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateReadings.map((reading) => {
              const glucoseValue = reading.glucose_level || reading.value;
              const timestamp = reading.reading_time || reading.timestamp;

              return (
                <TouchableOpacity
                  key={reading.id}
                  style={[
                    styles.readingCard,
                    { borderLeftColor: getGlucoseColor(glucoseValue) },
                  ]}
                  onLongPress={() => deleteReading(reading.id)}
                >
                  <View style={styles.readingHeader}>
                    <View
                      style={[
                        styles.glucoseBadge,
                        { backgroundColor: getGlucoseColor(glucoseValue) },
                      ]}
                    >
                      <Text style={styles.glucoseValue}>{glucoseValue}</Text>
                      <Text style={styles.glucoseUnit}>mg/dL</Text>
                    </View>
                    <View style={styles.readingInfo}>
                      <Text style={styles.readingTime}>{formatTime(timestamp)}</Text>
                      <Text style={styles.readingStatus}>
                        {getGlucoseStatus(glucoseValue)}
                      </Text>
                    </View>
                  </View>
                  {reading.notes && (
                    <View style={styles.notesContainer}>
                      <Text style={styles.notesLabel}>Notes:</Text>
                      <Text style={styles.notesText}>{reading.notes}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  readingCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glucoseBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  glucoseValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  glucoseUnit: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  readingInfo: {
    flex: 1,
  },
  readingTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  readingStatus: {
    fontSize: 14,
    color: '#6B7280',
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});
