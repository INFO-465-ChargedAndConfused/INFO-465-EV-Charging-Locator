const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const migrationsDir = __dirname;
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      console.log(`📝 Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✅ Successfully completed: ${file}\n`);
    } catch (error) {
      console.error(`❌ Error running migration ${file}:`, error.message);
      throw error;
    }
  }

  console.log('🎉 All migrations completed successfully!');
  await pool.end();
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('\n✓ Database setup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  });
