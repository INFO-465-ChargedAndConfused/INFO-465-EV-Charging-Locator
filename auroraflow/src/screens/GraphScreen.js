import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../constants/theme';
import { Colors } from '../constants/Colors';
import { API_BASE_URL } from '../../config/api';

const screenWidth = Dimensions.get('window').width;

export default function GraphScreen() {
  const insets = useSafeAreaInsets();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState(7);

  useEffect(() => {
    fetchReadings();
  }, [timePeriod]);

  const fetchReadings = async () => {
    setLoading(true);
    try {
      // Use API_BASE_URL which is configured with machine IP for iOS simulator
      const response = await fetch(`${API_BASE_URL}/glucose`);
      const data = await response.json();

      // Handle both response formats
      const readingsArray = data.readings || data;

      // Filter by time period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timePeriod);

      const filtered = readingsArray.filter(r => {
        const readingDate = new Date(r.reading_time || r.timestamp);
        return readingDate >= cutoffDate;
      });

      setReadings(filtered);
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
    setLoading(false);
  };

  const prepareChartData = () => {
    if (readings.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    const sortedReadings = [...readings].sort(
      (a, b) => new Date(a.reading_time || a.timestamp) - new Date(b.reading_time || b.timestamp)
    );

    const labels = sortedReadings.map((r) => {
      const date = new Date(r.reading_time || r.timestamp);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const data = sortedReadings.map((r) => r.glucose_level || r.value);

    return {
      labels: labels.length > 10 ? labels.filter((_, i) => i % Math.ceil(labels.length / 10) === 0) : labels,
      datasets: [
        {
          data: data,
          color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const calculateStats = () => {
    if (readings.length === 0) {
      return { average: 0, highest: 0, lowest: 0, inRange: 0 };
    }

    const values = readings.map((r) => r.glucose_level || r.value);
    const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const inRangeCount = values.filter((v) => v >= 70 && v <= 180).length;
    const inRange = Math.round((inRangeCount / values.length) * 100);

    return { average, highest, lowest, inRange };
  };

  const stats = calculateStats();
  const chartData = prepareChartData();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Trends</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={styles.loadingText}>Loading trends...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: 20 + insets.top }]}>
        <Text style={styles.headerTitle}>Trends</Text>
        <Text style={styles.headerSubtitle}>Glucose over time</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, timePeriod === 7 && styles.periodButtonActive]}
            onPress={() => setTimePeriod(7)}
          >
            <Text
              style={[styles.periodText, timePeriod === 7 && styles.periodTextActive]}
            >
              7 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, timePeriod === 30 && styles.periodButtonActive]}
            onPress={() => setTimePeriod(30)}
          >
            <Text
              style={[styles.periodText, timePeriod === 30 && styles.periodTextActive]}
            >
              30 Days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, timePeriod === 90 && styles.periodButtonActive]}
            onPress={() => setTimePeriod(90)}
          >
            <Text
              style={[styles.periodText, timePeriod === 90 && styles.periodTextActive]}
            >
              90 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart */}
        {readings.length > 0 ? (
          <View style={styles.chartContainer}>
            <LineChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#14B8A6',
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              fromZero={false}
              segments={4}
            />
            <View style={styles.targetRangeIndicator}>
              <View style={styles.targetRangeLine} />
              <Text style={styles.targetRangeText}>Target: 70-180 mg/dL</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyChartText}>No data for selected period</Text>
            <Text style={styles.emptyChartSubtext}>
              Log some glucose readings to see your trends
            </Text>
          </View>
        )}

        {/* Summary Stats */}
        {readings.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Summary Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>{stats.average}</Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Time in Range</Text>
                <Text style={[styles.statValue, { color: stats.inRange >= 70 ? '#14B8A6' : '#1F2937' }]}>
                  {stats.inRange}%
                </Text>
                <Text style={styles.statUnit}>70-180 mg/dL</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Highest</Text>
                <Text style={[styles.statValue, { color: stats.highest > 180 ? '#374151' : '#1F2937' }]}>
                  {stats.highest}
                </Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Lowest</Text>
                <Text style={[styles.statValue, { color: stats.lowest < 70 ? '#374151' : '#1F2937' }]}>
                  {stats.lowest}
                </Text>
                <Text style={styles.statUnit}>mg/dL</Text>
              </View>
            </View>
          </View>
        )}

        {/* Insights */}
        {readings.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>💡 Insights</Text>
            <View style={styles.insightCard}>
              {stats.inRange >= 70 ? (
                <>
                  <Text style={styles.insightEmoji}>🎉</Text>
                  <Text style={styles.insightText}>
                    Great job! You're spending {stats.inRange}% of your time in range.
                  </Text>
                </>
              ) : stats.inRange >= 50 ? (
                <>
                  <Text style={styles.insightEmoji}>💪</Text>
                  <Text style={styles.insightText}>
                    You're making progress! {stats.inRange}% time in range. Keep it up!
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.insightEmoji}>📊</Text>
                  <Text style={styles.insightText}>
                    Focus on getting more readings in your target range (70-180 mg/dL).
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
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
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodTextActive: {
    color: '#14B8A6',
  },
  chartContainer: {
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  targetRangeIndicator: {
    marginTop: 12,
    alignItems: 'center',
  },
  targetRangeLine: {
    width: 40,
    height: 2,
    backgroundColor: '#6B7280',
    marginBottom: 4,
  },
  targetRangeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyChart: {
    marginHorizontal: 16,
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyChartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 44) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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
  insightsContainer: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  insightText: {
    flex: 1,
    fontSize: 15,
    color: '#1E40AF',
    lineHeight: 22,
  },
});
