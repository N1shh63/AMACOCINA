const router = require("express").Router();
const { postOrders, getOrder, listOrdersHandler, patchOrderHandler, cleanOrdersHandler, deleteOrderHandler, getTopProductHandler } = require("../controllers/orders.controller");
const { authAdmin } = require("../middleware/authAdmin");

router.post("/", postOrders);
router.post("/clean", authAdmin, cleanOrdersHandler);
router.get("/", authAdmin, listOrdersHandler);
router.get("/top-product", getTopProductHandler);
router.get("/:id", getOrder);
router.patch("/:id", patchOrderHandler);
router.delete("/:id", authAdmin, deleteOrderHandler);

module.exports = router;

