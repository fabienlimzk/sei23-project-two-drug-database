const router = require("express").Router();
const User  = require("../models/user.model");
const Drug = require("../models/drug.model");
const isLoggedIn = require("../config/loginBlocker");


router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    let user = await User.find()
    res.render("dashboard/index", { user });
  } catch (error){
    console.log(error);
  }
});

module.exports = router;