const router = require("express").Router();
const { postOrders, getOrder, listOrdersHandler, patchOrderHandler, cleanOrdersHandler } = require("../controllers/orders.controller");

router.post("/", postOrders);
router.post("/clean", cleanOrdersHandler);
router.get("/", listOrdersHandler);
router.get("/:id", getOrder);
router.patch("/:id", patchOrderHandler);

module.exports = router;

