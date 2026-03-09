const router = require("express").Router();
const { postOrders, getOrder, listOrdersHandler } = require("../controllers/orders.controller");

router.post("/", postOrders);
router.get("/", listOrdersHandler);
router.get("/:id", getOrder);

module.exports = router;

