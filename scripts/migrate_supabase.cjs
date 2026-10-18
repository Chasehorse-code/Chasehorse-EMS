const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const pwd = process.env.SPRING_DATASOURCE_PASSWORD || process.env.SUPABASE_DB_PASSWORD || '3yRdrRkI1ZRl6wiv';
const connectionString = process.env.SPRING_DATASOURCE_URL
  ? process.env.SPRING_DATASOURCE_URL.replace('jdbc:postgresql://', 'postgresql://').replace('?sslmode=require', '')
  : `postgresql://postgres:${pwd}@db.phxybimufcrsnxfepiuz.supabase.co:5432/postgres`;

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL at db.phxybimufcrsnxfepiuz.supabase.co:5432 ...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to Supabase PostgreSQL database!');

    const v1Path = path.resolve(__dirname, '../backend/erp-api/src/main/resources/db/migration/V1__initial_schema.sql');
    console.log('Reading V1__initial_schema.sql from:', v1Path);
    const v1Sql = fs.readFileSync(v1Path, 'utf8');

    console.log('Executing V1__initial_schema.sql ...');
    await client.query(v1Sql);
    console.log('✅ V1__initial_schema.sql executed successfully!');

    const v2Path = path.resolve(__dirname, '../backend/erp-api/src/main/resources/db/migration/V2__enable_rls.sql');
    if (fs.existsSync(v2Path)) {
      console.log('Executing V2__enable_rls.sql ...');
      const v2Sql = fs.readFileSync(v2Path, 'utf8');
      await client.query(v2Sql);
      console.log('✅ V2__enable_rls.sql executed successfully!');
    }

    // Verify created tables
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('\n--- VERIFIED TABLES IN SUPABASE PUBLIC SCHEMA ---');
    res.rows.forEach((r, idx) => console.log(`${idx + 1}. ${r.table_name}`));
    console.log('------------------------------------------------');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    if (err.code) console.error('Error Code:', err.code);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await client.end();
  }
}

runMigration();
