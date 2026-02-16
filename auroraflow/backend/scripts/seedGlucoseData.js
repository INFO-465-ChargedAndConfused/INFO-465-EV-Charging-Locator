/**
 * Glucose Data Seeding Script
 *
 * Creates realistic 3-week glucose reading patterns for demo/testing
 *
 * USAGE:
 *   cd ~/auroraflow/backend
 *   node scripts/seedGlucoseData.js
 *
 * OPTIONS:
 *   --clear    Clear existing demo data before seeding
 *   --memory   Use memory store instead of database (for testing without DB)
 *
 * EXAMPLES:
 *   node scripts/seedGlucoseData.js --clear
 *   node scripts/seedGlucoseData.js --memory
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Check if using memory store
const useMemory = process.argv.includes('--memory');
const clearData = process.argv.includes('--clear');

// Import appropriate storage
let db;
if (useMemory) {
  db = require('../storage/memoryStore');
  console.log('📦 Using Memory Store (data will not persist after restart)\n');
} else {
  db = require('../config/database');
  console.log('🗄️  Using PostgreSQL Database\n');
}

// Demo user configuration
// IMPORTANT: Must match the userId used in memory store (guest-demo)
const DEMO_USER = {
  id: 'guest-demo',
  email: 'demo@auroraflow.com',
  name: 'Demo User'
};

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
    postBreakfast: { range: [180, 220], hour: 9.5, tag: 'after_breakfast', notes: ['Ate cereal', 'Had toast and juice', 'Pancakes this morning', ''] },
    preLunch: { range: [150, 180], hour: 12, notes: ['Before lunch', ''] },
    postLunch: { range: [190, 240], hour: 14, tag: 'after_lunch', notes: ['Ate pasta', 'Had sandwich and chips', 'Pizza lunch', 'Stressful day at work', ''] },
    preDinner: { range: [160, 190], hour: 18, notes: ['Before dinner', ''] },
    postDinner: { range: [180, 210], hour: 20, tag: 'after_dinner', notes: ['Forgot to walk after dinner', 'Large dinner', 'Had dessert', ''] },
    bedtime: { range: [150, 180], hour: 22, notes: ['Bedtime reading', ''] }
  };

  const pattern = patterns[readingType];
  if (!pattern) return null;

  const notes = pattern.notes[randomInRange(0, pattern.notes.length - 1)];

  return {
    glucose_level: generateGlucose(pattern.range[0], pattern.range[1]),
    reading_time: createTimestamp(daysAgo, pattern.hour),
    meal_tag: pattern.tag || null,
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
    postBreakfast: { range: [150, 180], hour: 9.5, tag: 'after_breakfast', notes: ['Oatmeal instead of cereal', 'Tried eggs and avocado', 'Lower carb breakfast', ''] },
    preLunch: { range: [130, 160], hour: 12, notes: ['Before lunch', ''] },
    postLunch: { range: [160, 190], hour: 14, tag: 'after_lunch', notes: ['Tried brown rice instead', 'Salad with protein', 'Walked 20 min after eating', 'Skipped dessert', ''] },
    preDinner: { range: [140, 170], hour: 18, notes: ['Before dinner', ''] },
    postDinner: { range: [155, 185], hour: 20, tag: 'after_dinner', notes: ['Smaller portions helping', 'Grilled chicken and veggies', 'Short walk after', ''] },
    bedtime: { range: [130, 160], hour: 22, notes: ['Bedtime check', ''] }
  };

  const pattern = patterns[readingType];
  if (!pattern) return null;

  const notes = pattern.notes[randomInRange(0, pattern.notes.length - 1)];

  return {
    glucose_level: generateGlucose(pattern.range[0], pattern.range[1]),
    reading_time: createTimestamp(daysAgo, pattern.hour),
    meal_tag: pattern.tag || null,
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
    postBreakfast: { range: [130, 160], hour: 9.5, tag: 'after_breakfast', notes: ['Meal prep working!', 'Consistent routine', 'Perfect portion', ''] },
    preLunch: { range: [110, 140], hour: 12, notes: ['Before lunch', ''] },
    postLunch: { range: [140, 170], hour: 14, tag: 'after_lunch', notes: ['Feeling great', 'Good food choices', 'Stable numbers!', ''] },
    preDinner: { range: [120, 150], hour: 18, notes: ['Before dinner', ''] },
    postDinner: { range: [135, 165], hour: 20, tag: 'after_dinner', notes: ['Routine is working', 'Balanced meal', 'So much better now', ''] },
    bedtime: { range: [110, 140], hour: 22, notes: ['Perfect bedtime reading', ''] }
  };

  const pattern = patterns[readingType];
  if (!pattern) return null;

  const notes = pattern.notes[randomInRange(0, pattern.notes.length - 1)];

  return {
    glucose_level: generateGlucose(pattern.range[0], pattern.range[1]),
    reading_time: createTimestamp(daysAgo, pattern.hour),
    meal_tag: pattern.tag || null,
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
          readings.push({
            ...reading,
            user_id: DEMO_USER.id
          });
        }
      }
    });
  }

  return readings;
}

/**
 * Insert readings into database
 */
async function insertReadingsDB(readings) {
  const query = `
    INSERT INTO glucose_readings (user_id, glucose_level, reading_time, notes, created_at)
    VALUES ($1, $2, $3, $4, NOW())
  `;

  for (const reading of readings) {
    await db.query(query, [
      reading.user_id,
      reading.glucose_level,
      reading.reading_time,
      reading.notes
    ]);
  }
}

/**
 * Insert readings into memory store
 */
async function insertReadingsMemory(readings) {
  for (const reading of readings) {
    await db.createReading(
      reading.user_id,
      reading.glucose_level,
      reading.reading_time,
      reading.notes
    );
  }
}

/**
 * Clear existing demo data from database
 */
async function clearDemoDataDB() {
  await db.query('DELETE FROM glucose_readings WHERE user_id = $1', [DEMO_USER.id]);
  console.log('🗑️  Cleared existing demo data from database\n');
}

/**
 * Clear existing demo data from memory
 */
async function clearDemoDataMemory() {
  const readings = await db.getReadings(DEMO_USER.id);
  for (const reading of readings) {
    await db.deleteReading(DEMO_USER.id, reading.id);
  }
  console.log('🗑️  Cleared existing demo data from memory\n');
}

/**
 * Main seeding function
 */
async function seedData() {
  console.log('🌱 Starting Glucose Data Seeding...\n');
  console.log(`📧 Demo User: ${DEMO_USER.email}`);
  console.log(`🆔 User ID: ${DEMO_USER.id}\n`);

  try {
    // Clear existing data if requested
    if (clearData) {
      if (useMemory) {
        await clearDemoDataMemory();
      } else {
        await clearDemoDataDB();
      }
    }

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

    console.log(`💾 Inserting ${allReadings.length} total readings...`);

    if (useMemory) {
      await insertReadingsMemory(allReadings);
    } else {
      await insertReadingsDB(allReadings);
    }

    console.log('\n✅ Seeding Complete!\n');
    console.log('📈 Summary:');
    console.log(`   Week 1 (Struggling): ${week1.length} readings`);
    console.log(`   Week 2 (Improving):  ${week2.length} readings`);
    console.log(`   Week 3 (Stable):     ${week3.length} readings`);
    console.log(`   ────────────────────────────────`);
    console.log(`   Total:               ${allReadings.length} readings\n`);

    // Calculate some stats
    const avgGlucose = allReadings.reduce((sum, r) => sum + r.glucose_level, 0) / allReadings.length;
    const week1Avg = week1.reduce((sum, r) => sum + r.glucose_level, 0) / week1.length;
    const week2Avg = week2.reduce((sum, r) => sum + r.glucose_level, 0) / week2.length;
    const week3Avg = week3.reduce((sum, r) => sum + r.glucose_level, 0) / week3.length;

    console.log('📊 Average Glucose Levels:');
    console.log(`   Week 1: ${week1Avg.toFixed(1)} mg/dL`);
    console.log(`   Week 2: ${week2Avg.toFixed(1)} mg/dL`);
    console.log(`   Week 3: ${week3Avg.toFixed(1)} mg/dL`);
    console.log(`   Overall: ${avgGlucose.toFixed(1)} mg/dL\n`);

    console.log('🎉 You can now test the glucose logging features with realistic data!\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    if (!useMemory && db.pool) {
      await db.pool.end();
    }
  }
}

// Run the seeding
seedData()
  .then(() => {
    console.log('✓ Seeding complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  });
