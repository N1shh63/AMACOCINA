const http = require("http");
const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`[RENDER_MARKER_20260303] listening on port ${PORT}`);
});