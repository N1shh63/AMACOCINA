const path = require("path");
const Database = require("better-sqlite3");

let dbSingleton = null;

function resolveDbPath() {
  const p = process.env.DB_PATH;
  if (p && typeof p === "string" && p.trim()) return p.trim();

  // Default to a file inside backend/ so the parent directory always exists.
  return path.join(__dirname, "..", "..", "amacocina.sqlite");
}

function getDb() {
  if (dbSingleton) return dbSingleton;

  const dbPath = resolveDbPath();
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  dbSingleton = db;
  return dbSingleton;
}

module.exports = { getDb, resolveDbPath };

