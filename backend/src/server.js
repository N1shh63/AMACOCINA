const app = require("./app");

const PORT = process.env.PORT || 4000;

// Render detecta el puerto si NO forzás host
app.listen(PORT, () => {
  console.log(`[API] running on port ${PORT}`);
});