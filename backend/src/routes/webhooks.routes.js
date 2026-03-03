const router = require("express").Router();
const { mercadopagoWebhook } = require("../controllers/webhooks.controller");

router.post("/mercadopago", mercadopagoWebhook);

module.exports = router;