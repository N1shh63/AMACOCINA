const router = require("express").Router();
const { postLogin } = require("../controllers/admin.controller");

router.post("/login", postLogin);

module.exports = router;
