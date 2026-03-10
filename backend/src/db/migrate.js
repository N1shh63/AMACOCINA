const fs = require("fs");
const path = require("path");
const { getDb } = require("./sqlite");

const usePg = process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim();

function nowIso() {
  return new Date().toISOString();
}

function listMigrationFiles(dirName) {
  const dir = path.join(__dirname, dirName);
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".sql"))
    .map((e) => e.name)
    .sort();
}

function migrateSqlite() {
  const db = getDb();
  const files = listMigrationFiles("migrations");
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
  );
  const rows = db.prepare("SELECT name FROM schema_migrations").all();
  const applied = new Set(rows.map((r) => r.name));

  for (const f of files) {
    if (applied.has(f)) continue;
    const full = path.join(__dirname, "migrations", f);
    const sql = fs.readFileSync(full, "utf8");
    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)").run(
        f,
        nowIso()
      );
    });
    tx();
  }
}

async function migratePg() {
  const pool = require("./postgres");
  const files = listMigrationFiles("migrations_pg");
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
  );
  const result = await pool.query("SELECT name FROM schema_migrations");
  const applied = new Set((result.rows || []).map((r) => r.name));

  for (const f of files) {
    if (applied.has(f)) continue;
    const full = path.join(__dirname, "migrations_pg", f);
    const sql = fs.readFileSync(full, "utf8");
    await pool.query(sql);
    await pool.query("INSERT INTO schema_migrations (name, applied_at) VALUES ($1, $2)", [
      f,
      nowIso(),
    ]);
  }
}

function migrate() {
  if (usePg) {
    return migratePg();
  }
  migrateSqlite();
  return Promise.resolve();
}

module.exports = { migrate };
