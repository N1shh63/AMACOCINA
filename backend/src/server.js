const app = require("./app");

const PORT = Number(process.env.PORT || 4000);

// IMPORTANTE: en Render hay que escuchar en 0.0.0.0
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[API] running on port ${PORT}`);
});