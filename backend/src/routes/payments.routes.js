const router = require("express").Router();
const { createPreference } = require("../controllers/payments.controller");

router.post("/create-preference", createPreference);

module.exports = router;