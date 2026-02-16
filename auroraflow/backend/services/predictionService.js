/**
 * PreSense Prediction Service
 * "Crystal Ball for Glucose" - AI-powered glucose predictions
 *
 * Features:
 * - Dawn phenomenon detection
 * - Post-meal spike predictions
 * - Hypoglycemia risk assessment
 * - Next reading predictions with confidence scores
 * - Pattern analysis and insights
 */

const memoryStore = require('../storage/memoryStore');

class PredictionService {
  /**
   * Analyze Dawn Phenomenon
   * Detects if morning glucose is significantly higher than bedtime
   *
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Dawn phenomenon analysis
   */
  async analyzeDawnPhenomenon(userId) {
    try {
      const readings = await memoryStore.getReadings(userId);

      // Get readings from past 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentReadings = readings.filter(r =>
        new Date(r.reading_time) >= twoWeeksAgo
      );

      // Separate morning (6-9 AM) and bedtime (10 PM - midnight) readings
      const morningReadings = [];
      const bedtimeReadings = [];

      recentReadings.forEach(r => {
        const hour = new Date(r.reading_time).getHours();
        const glucose = r.glucose_level || r.value;

        if (hour >= 6 && hour <= 9) {
          morningReadings.push(glucose);
        } else if (hour >= 22 || hour <= 1) {
          bedtimeReadings.push(glucose);
        }
      });

      if (morningReadings.length === 0 || bedtimeReadings.length === 0) {
        return {
          hasDawnPhenomenon: false,
          avgIncrease: 0,
          confidence: 0,
          message: 'Insufficient data for dawn phenomenon analysis',
          morningAvg: 0,
          bedtimeAvg: 0,
        };
      }

      // Calculate averages
      const morningAvg = morningReadings.reduce((a, b) => a + b, 0) / morningReadings.length;
      const bedtimeAvg = bedtimeReadings.reduce((a, b) => a + b, 0) / bedtimeReadings.length;
      const avgIncrease = morningAvg - bedtimeAvg;

      // Dawn phenomenon is detected if morning is 20+ mg/dL higher
      const hasDawnPhenomenon = avgIncrease >= 20;
      const confidence = Math.min(
        100,
        Math.max(0, ((morningReadings.length + bedtimeReadings.length) / 20) * 100)
      );

      return {
        hasDawnPhenomenon,
        avgIncrease: Math.round(avgIncrease),
        morningAvg: Math.round(morningAvg),
        bedtimeAvg: Math.round(bedtimeAvg),
        confidence: Math.round(confidence),
        message: hasDawnPhenomenon
          ? `Dawn phenomenon detected: Morning glucose averages ${Math.round(avgIncrease)} mg/dL higher than bedtime`
          : 'No significant dawn phenomenon detected',
        sampleSize: {
          morning: morningReadings.length,
          bedtime: bedtimeReadings.length,
        },
      };
    } catch (error) {
      console.error('Dawn phenomenon analysis error:', error);
      throw error;
    }
  }

  /**
   * Predict Post-Meal Spike
   * Estimates glucose levels 2 hours after eating based on historical data
   *
   * @param {string} userId - User identifier
   * @param {string} mealType - 'breakfast', 'lunch', or 'dinner'
   * @returns {Promise<Object>} Meal spike prediction
   */
  async predictPostMealSpike(userId, mealType = 'breakfast') {
    try {
      const readings = await memoryStore.getReadings(userId);

      // Get readings from past 3 weeks
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

      const recentReadings = readings.filter(r =>
        new Date(r.reading_time) >= threeWeeksAgo
      );

      // Define time windows for each meal
      const mealWindows = {
        breakfast: { start: 7, end: 10 },
        lunch: { start: 12, end: 15 },
        dinner: { start: 18, end: 21 },
      };

      const window = mealWindows[mealType.toLowerCase()] || mealWindows.breakfast;

      // Get post-meal readings (within meal time window)
      const postMealReadings = recentReadings
        .filter(r => {
          const hour = new Date(r.reading_time).getHours();
          return hour >= window.start && hour <= window.end;
        })
        .map(r => r.glucose_level || r.value);

      if (postMealReadings.length === 0) {
        return {
          predictedValue: 0,
          avgSpike: 0,
          confidence: 0,
          mealType,
          message: `Insufficient ${mealType} data for prediction`,
        };
      }

      // Calculate average post-meal glucose
      const avgPostMeal = postMealReadings.reduce((a, b) => a + b, 0) / postMealReadings.length;

      // Estimate pre-meal glucose (assume 20-30 mg/dL lower)
      const estimatedPreMeal = avgPostMeal - 25;
      const avgSpike = avgPostMeal - estimatedPreMeal;

      // Get latest reading to predict from current state
      const latestReading = readings[0]?.glucose_level || readings[0]?.value || avgPostMeal - 25;
      const predictedValue = latestReading + avgSpike;

      const confidence = Math.min(100, (postMealReadings.length / 15) * 100);

      return {
        predictedValue: Math.round(predictedValue),
        avgSpike: Math.round(avgSpike),
        avgPostMeal: Math.round(avgPostMeal),
        currentGlucose: Math.round(latestReading),
        confidence: Math.round(confidence),
        mealType,
        message: `After ${mealType}, glucose typically rises to ${Math.round(avgPostMeal)} mg/dL`,
        sampleSize: postMealReadings.length,
      };
    } catch (error) {
      console.error('Meal spike prediction error:', error);
      throw error;
    }
  }

  /**
   * Calculate Hypoglycemia Risk
   * Analyzes patterns of low glucose to predict risk
   *
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Hypo risk assessment
   */
  async calculateHypoRisk(userId) {
    try {
      const readings = await memoryStore.getReadings(userId);

      // Get readings from past 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentReadings = readings.filter(r =>
        new Date(r.reading_time) >= twoWeeksAgo
      );

      // Find low readings (below 70 mg/dL)
      const lowReadings = recentReadings.filter(r => {
        const glucose = r.glucose_level || r.value;
        return glucose < 70;
      });

      // Analyze time of day patterns
      const hourCounts = new Array(24).fill(0);
      lowReadings.forEach(r => {
        const hour = new Date(r.reading_time).getHours();
        hourCounts[hour]++;
      });

      // Find high-risk hours (hours with most low readings)
      const highRiskHours = [];
      const maxCount = Math.max(...hourCounts);
      if (maxCount > 0) {
        hourCounts.forEach((count, hour) => {
          if (count >= maxCount * 0.5) {
            highRiskHours.push({
              hour,
              count,
              timeLabel: this.formatHour(hour),
            });
          }
        });
      }

      // Calculate risk score (0-100)
      const lowReadingPercentage = (lowReadings.length / recentReadings.length) * 100;
      const riskScore = Math.min(100, Math.round(lowReadingPercentage * 5));

      // Determine risk level
      let riskLevel;
      let message;
      if (riskScore < 20) {
        riskLevel = 'low';
        message = 'Low risk of hypoglycemia';
      } else if (riskScore < 50) {
        riskLevel = 'moderate';
        message = 'Moderate risk - monitor closely';
      } else {
        riskLevel = 'high';
        message = 'High risk - consider discussing with your healthcare provider';
      }

      return {
        riskScore,
        riskLevel,
        message,
        lowReadingsCount: lowReadings.length,
        totalReadings: recentReadings.length,
        lowReadingPercentage: Math.round(lowReadingPercentage),
        highRiskTimes: highRiskHours,
        recommendations: this.getHypoRecommendations(riskLevel, highRiskHours),
      };
    } catch (error) {
      console.error('Hypo risk calculation error:', error);
      throw error;
    }
  }

  /**
   * Predict Next Reading
   * Uses recent trend to predict glucose in next 2-4 hours
   *
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Next reading prediction
   */
  async predictNextReading(userId) {
    try {
      const readings = await memoryStore.getReadings(userId);

      if (readings.length < 3) {
        return {
          predictedValue: 0,
          confidence: 0,
          trendDirection: 'unknown',
          message: 'Need at least 3 readings for prediction',
        };
      }

      // Get last 5 readings
      const recentReadings = readings.slice(0, 5).map(r => ({
        glucose: r.glucose_level || r.value,
        time: new Date(r.reading_time),
      }));

      // Calculate trend (using linear regression on recent readings)
      const trend = this.calculateTrend(recentReadings);

      // Get current glucose
      const currentGlucose = recentReadings[0].glucose;

      // Predict 3 hours from now
      const hoursAhead = 3;
      const predictedChange = trend.slope * hoursAhead * 60; // slope is per minute
      let predictedValue = currentGlucose + predictedChange;

      // Apply bounds (glucose shouldn't go below 40 or above 400 in 3 hours)
      predictedValue = Math.max(40, Math.min(400, predictedValue));

      // Calculate confidence based on trend consistency
      const confidence = this.calculatePredictionConfidence(recentReadings, trend);

      // Determine trend direction
      let trendDirection;
      let trendEmoji;
      if (trend.slope > 5) {
        trendDirection = 'rising';
        trendEmoji = '📈';
      } else if (trend.slope < -5) {
        trendDirection = 'falling';
        trendEmoji = '📉';
      } else {
        trendDirection = 'stable';
        trendEmoji = '➡️';
      }

      return {
        predictedValue: Math.round(predictedValue),
        currentGlucose: Math.round(currentGlucose),
        confidence: Math.round(confidence),
        trendDirection,
        trendEmoji,
        slope: trend.slope.toFixed(2),
        hoursAhead,
        message: `${trendEmoji} Glucose is ${trendDirection}. Predicted to be ${Math.round(predictedValue)} mg/dL in ${hoursAhead} hours`,
        readingsUsed: recentReadings.length,
      };
    } catch (error) {
      console.error('Next reading prediction error:', error);
      throw error;
    }
  }

  /**
   * Get Combined Insights
   * Returns all predictions and insights in one call
   *
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Combined insights
   */
  async getCombinedInsights(userId) {
    try {
      const [dawnPhenomenon, nextReading, hypoRisk, breakfastSpike, lunchSpike, dinnerSpike] =
        await Promise.all([
          this.analyzeDawnPhenomenon(userId),
          this.predictNextReading(userId),
          this.calculateHypoRisk(userId),
          this.predictPostMealSpike(userId, 'breakfast'),
          this.predictPostMealSpike(userId, 'lunch'),
          this.predictPostMealSpike(userId, 'dinner'),
        ]);

      return {
        dawnPhenomenon,
        nextReading,
        hypoRisk,
        mealPredictions: {
          breakfast: breakfastSpike,
          lunch: lunchSpike,
          dinner: dinnerSpike,
        },
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Combined insights error:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Calculate linear trend from readings
   */
  calculateTrend(readings) {
    const n = readings.length;
    if (n < 2) {
      return { slope: 0, intercept: readings[0]?.glucose || 0 };
    }

    // Use time in minutes as x, glucose as y
    const baseTime = readings[readings.length - 1].time.getTime();
    const points = readings.map((r, i) => ({
      x: (r.time.getTime() - baseTime) / (1000 * 60), // minutes
      y: r.glucose,
    }));

    // Linear regression
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate prediction confidence based on trend consistency
   */
  calculatePredictionConfidence(readings, trend) {
    if (readings.length < 3) return 30;

    // Calculate how well readings fit the trend line
    const baseTime = readings[readings.length - 1].time.getTime();
    let totalError = 0;

    readings.forEach(r => {
      const x = (r.time.getTime() - baseTime) / (1000 * 60);
      const predicted = trend.slope * x + trend.intercept;
      const error = Math.abs(predicted - r.glucose);
      totalError += error;
    });

    const avgError = totalError / readings.length;

    // Lower error = higher confidence
    const confidence = Math.max(30, Math.min(95, 100 - avgError));

    return confidence;
  }

  /**
   * Format hour for display
   */
  formatHour(hour) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  }

  /**
   * Get recommendations based on hypo risk
   */
  getHypoRecommendations(riskLevel, highRiskTimes) {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push('Consider discussing your glucose patterns with your healthcare provider');
      recommendations.push('Always carry fast-acting carbs (glucose tablets, juice)');
    }

    if (riskLevel === 'moderate' || riskLevel === 'high') {
      recommendations.push('Check glucose before driving or exercising');
      recommendations.push('Be extra cautious during identified high-risk times');
    }

    if (highRiskTimes.length > 0) {
      const times = highRiskTimes.map(t => t.timeLabel).join(', ');
      recommendations.push(`Monitor closely around: ${times}`);
    }

    if (riskLevel === 'low') {
      recommendations.push('Continue your current management routine');
      recommendations.push('Stay consistent with meals and monitoring');
    }

    return recommendations;
  }
}

// Export singleton instance
module.exports = new PredictionService();
