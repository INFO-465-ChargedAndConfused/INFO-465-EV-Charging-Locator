/**
 * PreSense Prediction API Routes
 * "Crystal Ball for Glucose" - Prediction endpoints
 */

const express = require('express');
const router = express.Router();
const predictionService = require('../services/predictionService');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/predictions/dawn-phenomenon
 * Analyze dawn phenomenon pattern
 */
router.get('/dawn-phenomenon', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const analysis = await predictionService.analyzeDawnPhenomenon(userId);

    res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Dawn phenomenon analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze dawn phenomenon',
      message: error.message,
    });
  }
});

/**
 * GET /api/predictions/meal-impact/:mealType
 * Predict post-meal glucose spike
 * Params: mealType = breakfast | lunch | dinner
 */
router.get('/meal-impact/:mealType', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { mealType } = req.params;

    // Validate meal type
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(mealType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid meal type. Must be one of: ${validMealTypes.join(', ')}`,
      });
    }

    const prediction = await predictionService.predictPostMealSpike(userId, mealType);

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Meal impact prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict meal impact',
      message: error.message,
    });
  }
});

/**
 * GET /api/predictions/hypo-risk
 * Calculate hypoglycemia risk score
 */
router.get('/hypo-risk', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const riskAssessment = await predictionService.calculateHypoRisk(userId);

    res.status(200).json({
      success: true,
      data: riskAssessment,
    });
  } catch (error) {
    console.error('Hypo risk calculation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate hypo risk',
      message: error.message,
    });
  }
});

/**
 * GET /api/predictions/next-reading
 * Predict next glucose reading based on trend
 */
router.get('/next-reading', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const prediction = await predictionService.predictNextReading(userId);

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error('Next reading prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict next reading',
      message: error.message,
    });
  }
});

/**
 * GET /api/predictions/insights
 * Get combined dashboard insights (all predictions)
 */
router.get('/insights', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const insights = await predictionService.getCombinedInsights(userId);

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error('Combined insights error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get insights',
      message: error.message,
    });
  }
});

module.exports = router;
