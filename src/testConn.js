/**
 * testConn.js
 */
import 'dotenv/config'
import oracledb from 'oracledb';
import { createDbConfig } from './config/dbConfig.js';
import { createRunner } from './yrunner.js';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

/* 
  Extra environment parameters now available:

  DATABASE=./data/hash_tracker.db
    → Path to your SQLite database file.

  DB_FAST_MODE=true
    → Toggle for PRAGMA fast mode (unsafe but faster).

  READ_BATCH_SIZE=6000
    → Number of rows fetched from Oracle per query.

  WRITE_BATCH_SIZE=2000
    → Number of rows inserted into SQLite per transaction.
*/

const testConnection = async (label, config) => {
  const runner = createRunner(config);
  try {
    const result = await runner.runSelectSQL(
      "SELECT sys_context('USERENV','DB_NAME') AS db_name, user AS current_user FROM dual"
    );
    if (result.success) {
      console.log(`${label} connection OK:`, result.rows[0]);
    } else {
      console.error(`${label} connection FAILED:`, result.message);
    }
  } catch (err) {
    console.error(`${label} connection ERROR:`, err);
  }
};

const sourceConfig = createDbConfig({
  user: process.env.SOURCE_ORACLEDB_USER,
  password: process.env.SOURCE_ORACLEDB_PASSWORD,
  connectString: process.env.SOURCE_ORACLEDB_CONNECTIONSTRING
});

const targetConfig = createDbConfig({
  user: process.env.TARGET_ORACLEDB_USER,
  password: process.env.TARGET_ORACLEDB_PASSWORD,
  connectString: process.env.TARGET_ORACLEDB_CONNECTIONSTRING
});

(async () => {
  // Show Oracle connections
  await testConnection("SOURCE", sourceConfig);
  await testConnection("TARGET", targetConfig);

  // Show new .env parameters
  console.log()
  console.log("SQLite DATABASE:", process.env.DATABASE);
  console.log("DB_FAST_MODE:", process.env.DB_FAST_MODE);
  console.log("READ_BATCH_SIZE:", process.env.READ_BATCH_SIZE || "1000 (default)");
  console.log("WRITE_BATCH_SIZE:", process.env.WRITE_BATCH_SIZE || "1000 (default)");
})();
