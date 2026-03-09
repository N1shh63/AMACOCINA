const fs = require("fs");
const path = require("path");
const { getDb } = require("./sqlite");

function nowIso() {
  return new Date().toISOString();
}

function listMigrationFiles() {
  const dir = path.join(__dirname, "migrations");
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".sql"))
    .map((e) => e.name)
    .sort();
}

function ensureSchemaMigrationsTable(db) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
  );
}

function getAppliedMigrations(db) {
  ensureSchemaMigrationsTable(db);
  const rows = db.prepare("SELECT name FROM schema_migrations").all();
  return new Set(rows.map((r) => r.name));
}

function applyMigration(db, filename) {
  const full = path.join(__dirname, "migrations", filename);
  const sql = fs.readFileSync(full, "utf8");

  const tx = db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)")
      .run(filename, nowIso());
  });

  tx();
}

function migrate() {
  const db = getDb();
  const files = listMigrationFiles();
  const applied = getAppliedMigrations(db);

  for (const f of files) {
    if (applied.has(f)) continue;
    applyMigration(db, f);
  }
}

module.exports = { migrate };

