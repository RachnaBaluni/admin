const express = require("express");
const MemberController = require("../Controllers/Member.controller.js");
const { authenticateDB, isAdmin } = require("../MiddleWare/authMiddleware.js");

const router = express.Router();

router.post("/register", MemberController.register);
router.post("/login", MemberController.login);
router.get("/me", authenticateDB, MemberController.getMe);
router.post("/logout", MemberController.logout);
router.get("/all", isAdmin, MemberController.getAllMembers);
router.put("/approve", isAdmin, MemberController.approveMember);
router.get("/pending", isAdmin, MemberController.getPendingMembers);
router.get("/verified", isAdmin, MemberController.getVerifiedMembers);
router.delete("/delete", isAdmin, MemberController.deleteMember);
router.put("/remove", isAdmin, MemberController.removeMember);

module.exports = router;
console.log("ME route file loaded");