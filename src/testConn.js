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

const testConnection = async (config) => {
  const runner = createRunner(config);
  try {
    const result = await runner.runSelectSQL(
      "SELECT sys_context('USERENV','DB_NAME') AS db_name, user AS current_user FROM dual"
    );
    if (result.success) {
      console.log(`Connection OK:`, result.rows[0]);

      const banner = await runner.runSelectSQL(
        "select banner from v$version"
      )
      console.log(banner.rows[0].BANNER);
    } else {
      console.error(`Connection FAILED:`, result.message);
    }
  } catch (err) {
    console.error(`$Connection ERROR:`, err);
  }
};
const host = process.env.ORACLE_HOST || 'localhost'; 
const port = process.env.ORACLE_PORT || 1521; 
const database = process.env.ORACLE_DATABASE || 'XEPDB1';

const config = createDbConfig({
  user: process.env.ORACLE_APP_USER,
  password: process.env.ORACLE_APP_USER_PASSWORD,
  // oracle-dev-scan/pdbdev_srv
  connectString: `${host}:${port}/${database}`
});

(async () => {
  // Show Oracle connections
  console.log('conig =', config)
  await testConnection(config);
})();
