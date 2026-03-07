const router = require("express").Router();
const { createPreference } = require("../controllers/payments.controller");

router.post("/create-preference", createPreference);

router.post("/webhook", (req, res) => {
  console.log("[MP WEBHOOK] query:", req.query);
  console.log("[MP WEBHOOK] body:", req.body);
  res.sendStatus(200);
});

module.exports = router;