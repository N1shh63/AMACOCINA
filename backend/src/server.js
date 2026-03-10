const http = require("http");
const app = require("./app");
const { migrate } = require("./db/migrate");

const PORT = Number(process.env.PORT || 4000);
const server = http.createServer(app);

migrate()
  .then(() => {
    if (process.env.DATABASE_URL) {
      console.log("Connected to Neon Postgres");
    }
    server.listen(PORT, () => {
      console.log(`[RENDER_MARKER_20260303] listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[DB] migration failed:", err);
    process.exit(1);
  });