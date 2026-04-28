const MemberServices = require("../Services/Members.service");

const register = async (req, res) => {
  console.log("REQ BODY:", req.body);
  try {
    const reply = await MemberServices.Register(req.body);
    res.status(200).json(reply);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {

  try {
    const { type, identifier, password } = req.body;


    const result = await MemberServices.Login({ type, identifier, password });

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "Lax",
    });
    return res.status(200).json({
      success: result.success,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error("Error in loginController:", error);
    const statusCode = error.statusCode || 500;
    const errorMessage =
      error.message || "An unexpected error occurred during login.";

    return res.status(statusCode).json({
      success: false,
      message: errorMessage,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const userDetails = req.user;

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully.",
      user: userDetails,
    });
  } catch (error) {
    console.error("Error in getMe controller:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching user details.",
    });
  }
};

const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ success: false, message: "Logout failed." });
  }
};

const getAllMembers = async (req, res) => {
  try {
    const members = await MemberServices.getAllMembers();
    res.status(200).json({
      success: true,
      message: "Fetched all members successfully",
      data: members,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const approveMember = async (req, res) => {
  try {
    const { memberId, memberType } = req.body;
    const member = await MemberServices.approveMember(memberId, memberType);
    res.status(200).json({
      success: true,
      message: "Member approved successfully",
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getPendingMembers = async (req, res) => {
  try {
    const members = await MemberServices.getPendingMembers();
    res.status(200).json({
      success: true,
      message: "Fetched pending members successfully",
      data: members,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getVerifiedMembers = async (req, res) => {
  try {
    const members = await MemberServices.getVerifiedMembers();
    res.status(200).json({
      success: true,
      message: "Fetched verified members successfully",
      data: members,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteMember = async (req, res) => {
  try {
    const { memberId, memberType } = req.body;
    await MemberServices.deleteMember(memberId, memberType);
    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const { memberId, memberType } = req.body;
    const member = await MemberServices.removeMember(memberId, memberType);
    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  getAllMembers,
  approveMember,
  getPendingMembers,
  getVerifiedMembers,
  deleteMember,
  removeMember,
};
