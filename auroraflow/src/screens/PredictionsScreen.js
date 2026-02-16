/**
 * PreSense Predictions Screen
 * "Crystal Ball for Glucose" - AI-powered glucose predictions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../config/api';
import { Colors } from '../constants/Colors';

const screenWidth = Dimensions.get('window').width;

export default function PredictionsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [readings, setReadings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setError(null);

      // Fetch predictions and readings in parallel
      const [predictionsRes, readingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/predictions/insights`),
        fetch(`${API_BASE_URL}/glucose`)
      ]);

      const predictionsData = await predictionsRes.json();
      const readingsData = await readingsRes.json();

      if (predictionsData.success) {
        setPredictions(predictionsData.data);
      }

      if (readingsData.success) {
        setReadings(readingsData.readings || []);
      }
    } catch (err) {
      console.error('Error fetching predictions:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPredictions();
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return '#DC2626'; // red
      case 'moderate':
        return '#F59E0B'; // yellow/orange
      case 'low':
      default:
        return '#10B981'; // green
    }
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'rising':
        return 'trending-up';
      case 'falling':
        return 'trending-down';
      case 'stable':
      default:
        return 'remove-outline';
    }
  };

  const prepareChartData = () => {
    if (!readings || readings.length === 0) {
      return null;
    }

    // Get last 12 hours of readings
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const recentReadings = readings
      .filter(r => new Date(r.reading_time) >= twelveHoursAgo)
      .sort((a, b) => new Date(a.reading_time) - new Date(b.reading_time))
      .slice(-20); // Max 20 points for readability

    if (recentReadings.length === 0) return null;

    // Prepare actual data
    const labels = recentReadings.map(r => {
      const time = new Date(r.reading_time);
      return `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;
    });

    const data = recentReadings.map(r => r.glucose_level || r.value);

    // Add predicted points
    if (predictions?.nextReading?.predictedValue) {
      const lastReading = data[data.length - 1];
      const predictedValue = predictions.nextReading.predictedValue;

      // Add intermediate point for smooth curve
      const midpoint = (lastReading + predictedValue) / 2;

      labels.push('+1.5h');
      labels.push('+3h');
      data.push(midpoint);
      data.push(predictedValue);
    }

    return { labels, data };
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.header}>
          <Text style={styles.headerTitle}>PreSense Predictions</Text>
          <Text style={styles.headerSubtitle}>Crystal Ball for Glucose</Text>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>Loading predictions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.header}>
          <Text style={styles.headerTitle}>PreSense Predictions</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPredictions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = prepareChartData();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.header}>
        <Text style={styles.headerTitle}>PreSense Predictions</Text>
        <Text style={styles.headerSubtitle}>Crystal Ball for Glucose ✨</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0D9488"
          />
        }
      >
        {/* HERO CARD - Next Prediction */}
        {predictions?.nextReading && (
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Ionicons
                name={getTrendIcon(predictions.nextReading.trendDirection)}
                size={32}
                color="#0D9488"
              />
              <Text style={styles.heroLabel}>Next Prediction</Text>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroValue}>
                {predictions.nextReading.predictedValue}
                <Text style={styles.heroUnit}> mg/dL</Text>
              </Text>
              <Text style={styles.heroTime}>
                in {predictions.nextReading.hoursAhead} hours
              </Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {predictions.nextReading.confidence}% confident
                </Text>
              </View>
            </View>

            <View style={styles.trendInfo}>
              <Text style={styles.trendEmoji}>{predictions.nextReading.trendEmoji}</Text>
              <Text style={styles.trendMessage}>{predictions.nextReading.message}</Text>
            </View>
          </View>
        )}

        {/* VISUAL PREDICTION CURVE */}
        {chartData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Prediction Curve</Text>
            <Text style={styles.cardSubtitle}>
              Past 12 hours + Next {predictions?.nextReading?.hoursAhead || 3} hours
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [{
                    data: chartData.data,
                    color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
                    strokeWidth: 3
                  }]
                }}
                width={Math.max(screenWidth - 40, chartData.labels.length * 50)}
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#f0fdfa',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(13, 148, 136, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#0D9488',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#e5e7eb',
                  },
                }}
                bezier
                style={styles.chart}
                segments={4}
                fromZero={false}
              />
            </ScrollView>

            {/* Color zones legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Target (70-140)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Caution (140-180)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
                <Text style={styles.legendText}>Alert (>180/<70)</Text>
              </View>
            </View>
          </View>
        )}

        {/* RISK ALERTS SECTION */}
        {predictions?.hypoRisk && (
          <View style={styles.card}>
            <View style={styles.riskHeader}>
              <Ionicons
                name={predictions.hypoRisk.riskLevel === 'high' ? 'warning' : 'shield-checkmark'}
                size={24}
                color={getRiskColor(predictions.hypoRisk.riskLevel)}
              />
              <Text style={styles.cardTitle}>Hypoglycemia Risk</Text>
            </View>

            <View style={[
              styles.riskBadge,
              { backgroundColor: `${getRiskColor(predictions.hypoRisk.riskLevel)}20` }
            ]}>
              <Text style={[
                styles.riskScore,
                { color: getRiskColor(predictions.hypoRisk.riskLevel) }
              ]}>
                {predictions.hypoRisk.riskScore}/100
              </Text>
              <Text style={[
                styles.riskLevel,
                { color: getRiskColor(predictions.hypoRisk.riskLevel) }
              ]}>
                {predictions.hypoRisk.riskLevel.toUpperCase()} RISK
              </Text>
            </View>

            <Text style={styles.riskMessage}>{predictions.hypoRisk.message}</Text>

            {predictions.hypoRisk.recommendations && predictions.hypoRisk.recommendations.length > 0 && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                {predictions.hypoRisk.recommendations.map((rec, idx) => (
                  <View key={idx} style={styles.recommendationItem}>
                    <Text style={styles.recommendationBullet}>•</Text>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {predictions.hypoRisk.highRiskTimes && predictions.hypoRisk.highRiskTimes.length > 0 && (
              <View style={styles.highRiskTimes}>
                <Text style={styles.highRiskTitle}>⚠️ High Risk Times:</Text>
                {predictions.hypoRisk.highRiskTimes.map((time, idx) => (
                  <Text key={idx} style={styles.highRiskTime}>
                    {time.timeLabel} ({time.count} incidents)
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* PATTERN INSIGHTS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pattern Insights</Text>

          {/* Dawn Phenomenon */}
          {predictions?.dawnPhenomenon && (
            <View style={styles.patternItem}>
              <View style={styles.patternHeader}>
                <Ionicons
                  name="sunny"
                  size={20}
                  color={predictions.dawnPhenomenon.hasDawnPhenomenon ? '#F59E0B' : '#10B981'}
                />
                <Text style={styles.patternTitle}>Dawn Phenomenon</Text>
              </View>
              <Text style={styles.patternMessage}>
                {predictions.dawnPhenomenon.message}
              </Text>
              {predictions.dawnPhenomenon.hasDawnPhenomenon && (
                <View style={styles.patternStats}>
                  <Text style={styles.patternStat}>
                    Morning avg: {predictions.dawnPhenomenon.morningAvg} mg/dL
                  </Text>
                  <Text style={styles.patternStat}>
                    Bedtime avg: {predictions.dawnPhenomenon.bedtimeAvg} mg/dL
                  </Text>
                  <Text style={styles.patternStat}>
                    Increase: +{predictions.dawnPhenomenon.avgIncrease} mg/dL
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Post-Meal Patterns */}
          {predictions?.mealPredictions && (
            <>
              {['breakfast', 'lunch', 'dinner'].map(meal => {
                const mealData = predictions.mealPredictions[meal];
                if (!mealData || mealData.confidence === 0) return null;

                return (
                  <View key={meal} style={styles.patternItem}>
                    <View style={styles.patternHeader}>
                      <Ionicons
                        name="restaurant"
                        size={20}
                        color="#0D9488"
                      />
                      <Text style={styles.patternTitle}>
                        {meal.charAt(0).toUpperCase() + meal.slice(1)} Impact
                      </Text>
                    </View>
                    <Text style={styles.patternMessage}>{mealData.message}</Text>
                    <View style={styles.patternStats}>
                      <Text style={styles.patternStat}>
                        Typical spike: +{mealData.avgSpike} mg/dL
                      </Text>
                      <Text style={styles.patternStat}>
                        Confidence: {mealData.confidence}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* Footer spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 12,
  },
  heroContent: {
    alignItems: 'center',
    marginVertical: 12,
  },
  heroValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#0D9488',
  },
  heroUnit: {
    fontSize: 24,
    fontWeight: '400',
    color: '#64748b',
  },
  heroTime: {
    fontSize: 20,
    color: '#64748b',
    marginTop: 8,
  },
  confidenceBadge: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  trendEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  trendMessage: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskBadge: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  riskScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  riskMessage: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 16,
    textAlign: 'center',
  },
  recommendationsContainer: {
    backgroundColor: '#f0fdfa',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  recommendationBullet: {
    color: '#0D9488',
    marginRight: 8,
    fontSize: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  highRiskTimes: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  highRiskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  highRiskTime: {
    fontSize: 13,
    color: '#78350f',
    marginLeft: 12,
    marginBottom: 4,
  },
  patternItem: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  patternMessage: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  patternStats: {
    marginTop: 8,
  },
  patternStat: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
});
