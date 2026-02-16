/**
 * Glucose Data Seeding Script - API Version
 *
 * Creates realistic 3-week glucose reading patterns via API calls
 * This works with the running server (no separate memory instances!)
 *
 * USAGE:
 *   cd ~/auroraflow/backend
 *   node scripts/seedGlucoseDataAPI.js
 *
 * REQUIREMENTS:
 *   - Backend server must be running (npm run server)
 *   - Server must be accessible at http://localhost:3000
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/glucose';
const DEMO_USER_ID = 'guest-demo';

/**
 * Generate random number within range
 */
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random glucose value with slight variance
 */
function generateGlucose(min, max, variance = 5) {
  const base = randomInRange(min, max);
  const adjust = randomInRange(-variance, variance);
  return Math.max(20, Math.min(600, base + adjust));
}

/**
 * Create timestamp for a specific day, hour, and minute variance
 */
function createTimestamp(daysAgo, hour, minuteVariance = 30) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour);
  date.setMinutes(randomInRange(0, minuteVariance));
  date.setSeconds(0);
  return date.toISOString();
}

/**
 * Week 1 - "Struggling" Pattern
 */
function generateWeek1Reading(daysAgo, readingType) {
  const patterns = {
    fasting: { range: [140, 180], hour: 7, notes: ['Dawn phenomenon spike', 'Woke up high', ''] },
    preBreakfast: { range: [135, 170], hour: 7.5, notes: ['Before breakfast', ''] },
    postBreakfast: { range: [180, 220], hour: 9.5, notes: ['Ate cereal', 'Had toast and juice', 'Pancakes this morning', ''] },
    preLunch: { range: [150, 180], hour: 12, notes: ['Before lunch', ''] },
    postLunch: { range: [190, 240], hour: 14, notes: ['Ate pasta', 'Had sandwich and chips', 'Pizza lunch', 'Stressful day at work', ''] },
    preDinner: { range: [160, 190], hour: 18, notes: ['Before dinner', ''] },
    postDinner: { range: [180, 210], hour: 20, notes: ['Forgot to walk after dinner', 'Large dinner', 'Had dessert', ''] },
    bedtime: { range: [150, 180], hour: 22, notes: ['Bedtime reading', ''] }
  };

  const pattern = patterns[readingType];
  if (!pattern) return null;

  const notes = pattern.notes[randomInRange(0, pattern.notes.length - 1)];

  return {
    value: generateGlucose(pattern.range[0], pattern.range[1]),
    timestamp: createTimestamp(daysAgo, pattern.hour),
    notes: notes || null
  };
}

/**
 * Week 2 - "Improving" Pattern
 */
function generateWeek2Reading(daysAgo, readingType) {
  const patterns = {
    fasting: { range: [120, 150], hour: 7, notes: ['Better morning reading', 'Improving!', ''] },
    preBreakfast: { range: [115, 145], hour: 7.5, notes: ['Before breakfast', ''] },
    postBreakfast: { range: [150, 180], hour: 9.5, notes: ['Oatmeal instead of cereal', 'Tried eggs and avocado', 'Lower carb breakfast', ''] },
    preLunch: { range: [130, 160], hour: 12, notes: ['Before lunch', ''] },
    postLunch: { range: [160, 190], hour: 14, notes: ['Tried brown rice instead', 'Salad with protein', 'Walked 20 min after eating', 'Skipped dessert', ''] },
    preDinner: { range: [140, 170], hour: 18, notes: ['Before dinner', ''] },
    postDinner: { range: [155, 185], hour: 20, notes: ['Smaller portions helping', 'Grilled chicken and veggies', 'Short walk after', ''] },
    bedtime: { range: [130, 160], hour: 22, notes: ['Bedtime check', ''] }
  };

  const pattern = patterns[readingType];
  if (!pattern) return null;

  const notes = pattern.notes[randomInRange(0, pattern.notes.length - 1)];

  return {
    value: generateGlucose(pattern.range[0], pattern.range[1]),
    timestamp: createTimestamp(daysAgo, pattern.hour),
    notes: notes || null
  };
}

/**
 * Week 3 - "Stable" Pattern
 */
function generateWeek3Reading(daysAgo, readingType) {
  const patterns = {
    fasting: { range: [100, 130], hour: 7, notes: ['Great fasting number!', 'In target range', ''] },
    preBreakfast: { range: [95, 125], hour: 7.5, notes: ['Before breakfast', ''] },
    postBreakfast: { range: [130, 160], hour: 9.5, notes: ['Meal prep working!', 'Consistent routine', 'Perfect portion', ''] },
    preLunch: { range: [110, 140], hour: 12, notes: ['Before lunch', ''] },
    postLunch: { range: [140, 170], hour: 14, notes: ['Feeling great', 'Good food choices', 'Stable numbers!', ''] },
    preDinner: { range: [120, 150], hour: 18, notes: ['Before dinner', ''] },
    postDinner: { range: [135, 165], hour: 20, notes: ['Routine is working', 'Balanced meal', 'So much better now', ''] },
    bedtime: { range: [110, 140], hour: 22, notes: ['Perfect bedtime reading', ''] }
  };

  const pattern = patterns[readingType];
  if (!pattern) return null;

  const notes = pattern.notes[randomInRange(0, pattern.notes.length - 1)];

  return {
    value: generateGlucose(pattern.range[0], pattern.range[1]),
    timestamp: createTimestamp(daysAgo, pattern.hour),
    notes: notes || null
  };
}

/**
 * Generate all readings for a week
 */
function generateWeekReadings(weekNumber, daysOffset) {
  const readings = [];
  const readingTypes = {
    1: ['fasting', 'preBreakfast', 'postBreakfast', 'preLunch', 'postLunch', 'preDinner', 'postDinner', 'bedtime'], // 8 readings
    2: ['fasting', 'postBreakfast', 'preLunch', 'postLunch', 'postDinner', 'bedtime'], // 6 readings
    3: ['fasting', 'postBreakfast', 'postLunch', 'postDinner', 'bedtime'] // 5 readings
  };

  const weekTypes = readingTypes[weekNumber];
  const generator = weekNumber === 1 ? generateWeek1Reading :
                   weekNumber === 2 ? generateWeek2Reading :
                   generateWeek3Reading;

  for (let day = 0; day < 7; day++) {
    const daysAgo = daysOffset + (6 - day);
    const isWeekend = day === 5 || day === 6;

    // Occasionally skip some readings (realistic behavior)
    const skipChance = isWeekend ? 0.3 : 0.1;

    weekTypes.forEach(type => {
      if (Math.random() > skipChance) {
        const reading = generator(daysAgo, type);
        if (reading) {
          readings.push(reading);
        }
      }
    });
  }

  return readings;
}

/**
 * Clear existing demo data via API
 */
async function clearDemoData() {
  try {
    console.log('🗑️  Fetching existing readings...');
    const response = await axios.get(API_URL);
    const readings = response.data.readings || [];

    console.log(`   Found ${readings.length} existing readings`);

    for (const reading of readings) {
      await axios.delete(`${API_URL}/${reading.id}`);
    }

    console.log('✅ Cleared existing demo data\n');
  } catch (error) {
    console.log('⚠️  Could not clear data (might not exist yet)\n');
  }
}

/**
 * Create reading via API
 */
async function createReading(reading) {
  try {
    await axios.post(API_URL, reading);
  } catch (error) {
    console.error(`Failed to create reading:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function seedData() {
  console.log('🌱 Starting Glucose Data Seeding via API...\n');
  console.log(`📧 Demo User ID: ${DEMO_USER_ID}`);
  console.log(`🔌 API Endpoint: ${API_URL}\n`);

  try {
    // Check if server is running
    console.log('🔍 Checking if backend server is running...');
    await axios.get('http://localhost:3000/health');
    console.log('✅ Backend server is running\n');

    // Clear existing data
    await clearDemoData();

    // Generate readings for all 3 weeks
    console.log('📊 Generating Week 1 (Days 21-15 ago) - "Struggling" pattern...');
    const week1 = generateWeekReadings(1, 21);
    console.log(`   Created ${week1.length} readings\n`);

    console.log('📊 Generating Week 2 (Days 14-8 ago) - "Improving" pattern...');
    const week2 = generateWeekReadings(2, 14);
    console.log(`   Created ${week2.length} readings\n`);

    console.log('📊 Generating Week 3 (Days 7-1 ago) - "Stable" pattern...');
    const week3 = generateWeekReadings(3, 7);
    console.log(`   Created ${week3.length} readings\n`);

    const allReadings = [...week1, ...week2, ...week3];

    console.log(`💾 Inserting ${allReadings.length} total readings via API...`);

    let created = 0;
    for (const reading of allReadings) {
      await createReading(reading);
      created++;
      if (created % 20 === 0) {
        process.stdout.write(`   Progress: ${created}/${allReadings.length}\r`);
      }
    }
    console.log(`   Progress: ${created}/${allReadings.length} ✓`);

    console.log('\n✅ Seeding Complete!\n');
    console.log('📈 Summary:');
    console.log(`   Week 1 (Struggling): ${week1.length} readings`);
    console.log(`   Week 2 (Improving):  ${week2.length} readings`);
    console.log(`   Week 3 (Stable):     ${week3.length} readings`);
    console.log(`   ────────────────────────────────`);
    console.log(`   Total:               ${allReadings.length} readings\n`);

    // Calculate some stats
    const avgGlucose = allReadings.reduce((sum, r) => sum + r.value, 0) / allReadings.length;
    const week1Avg = week1.reduce((sum, r) => sum + r.value, 0) / week1.length;
    const week2Avg = week2.reduce((sum, r) => sum + r.value, 0) / week2.length;
    const week3Avg = week3.reduce((sum, r) => sum + r.value, 0) / week3.length;

    console.log('📊 Average Glucose Levels:');
    console.log(`   Week 1: ${week1Avg.toFixed(1)} mg/dL`);
    console.log(`   Week 2: ${week2Avg.toFixed(1)} mg/dL`);
    console.log(`   Week 3: ${week3Avg.toFixed(1)} mg/dL`);
    console.log(`   Overall: ${avgGlucose.toFixed(1)} mg/dL\n`);

    console.log('🎉 You can now test the glucose logging features with realistic data!\n');

    // Verify the data was created
    const verifyResponse = await axios.get(API_URL);
    console.log(`✅ Verification: ${verifyResponse.data.count} readings now in database\n`);

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Error: Cannot connect to backend server!');
      console.error('   Make sure the server is running: npm run server\n');
    } else {
      console.error('❌ Error seeding data:', error.message);
    }
    throw error;
  }
}

// Run the seeding
seedData()
  .then(() => {
    console.log('✓ Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seeding failed');
    process.exit(1);
  });
