const express = require("express");
const router = express.Router(); // 
const MainEventController = require("../Controllers/MainEvent.controller.js");
const { isAdmin } = require("../MiddleWare/authMiddleware.js");
const MainEvent = require("../models/MainEvent.model.js"); // 


router.get("/", MainEventController.getMainEvents);
router.get("/:id", MainEventController.getMainEventById);

router.post("/add", isAdmin, MainEventController.addMainEvent);
router.put("/update/:id", isAdmin, MainEventController.updateMainEvent);
router.delete("/delete/:id", isAdmin, MainEventController.deleteMainEvent);

module.exports = router;