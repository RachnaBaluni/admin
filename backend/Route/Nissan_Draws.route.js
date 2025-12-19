const express = require("express");
const drawController = require("../Controllers/Nissan_Draws.controller.js");
const { isAdmin } = require("../MiddleWare/authMiddleware.js");

const router = express.Router();

router.put("/swap-matchup/", isAdmin, drawController.swapMatchup);
router.put("/update-matchup/", isAdmin, drawController.updateMatchup);
router.put("/update-order", isAdmin, drawController.updateDrawOrder);

router.post("/", isAdmin, drawController.createDrawforEvent);
router.get("/:eventId", drawController.getDrawsByEvent);
router.put("/:drawId", isAdmin, drawController.updateDraw);
router.delete("/:drawId", isAdmin, drawController.deleteDraw);

router.post("/updateTime/:drawId", isAdmin, drawController.updateTime);
router.post("/updateCourt/:drawId", isAdmin, drawController.updateCourt);

module.exports = router;
