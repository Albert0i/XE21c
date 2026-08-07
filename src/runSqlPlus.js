import { spawn } from "child_process";
import dotenv from "dotenv";

dotenv.config();

// Pick which user you want to connect with
const user = process.env.TARGET_ORACLEDB_USER || process.env.ORACLE_APP_USER;
const password = process.env.TARGET_ORACLEDB_PASSWORD || process.env.ORACLE_APP_USER_PASSWORD;
const connectString = process.env.TARGET_ORACLEDB_CONNECTIONSTRING || process.env.ORACLE_DATABASE;

// Build sqlplus command
const conn = `${user}/${password}@//${connectString}`;

console.log("Launching SQL*Plus with:", conn);

const sqlplus = spawn("sqlplus", [conn], { stdio: "inherit" });

sqlplus.on("exit", (code) => {
  console.log(`SQL*Plus exited with code ${code}`);
});
