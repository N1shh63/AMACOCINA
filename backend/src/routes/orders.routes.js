const router = require("express").Router();
const { postOrders, getOrder, listOrdersHandler, patchOrderHandler } = require("../controllers/orders.controller");

router.post("/", postOrders);
router.get("/", listOrdersHandler);
router.get("/:id", getOrder);
router.patch("/:id", patchOrderHandler);

module.exports = router;

