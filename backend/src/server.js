const http = require("http");
const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

http.createServer(app).listen(PORT, "127.0.0.1", () => {
  console.log(`[API] running on http://127.0.0.1:${PORT}`);
});