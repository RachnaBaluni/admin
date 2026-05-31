const express = require("express");
const router = express.Router();

const {
  saveOrderOfPlay,
  getOrderOfPlay
} = require("../Controllers/OrderOfPlay.js");

// debug (correct way)
console.log("saveOrderOfPlay:", saveOrderOfPlay);
console.log("getOrderOfPlay:", getOrderOfPlay);

router.post("/order-of-play", saveOrderOfPlay);
router.get("/order-of-play/:eventId", getOrderOfPlay);

module.exports = router;