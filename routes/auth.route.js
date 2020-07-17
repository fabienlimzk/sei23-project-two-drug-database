const router = require("express").Router();
const User = require("../models/user.model");
const passport = require("../config/passportConfig");
const isLoggedIn = require("../config/loginBlocker");

router.get("/auth/register", (req, res) => {
  res.render("auth/register");
});

router.post("/auth/register", async (req, res) => {
  console.log(req.body);
  try {
    let { firstname, lastname, dateOfBirth, phone, email, password } = req.body;
    
    let user = new User(
      {
        firstname, 
        lastname,
        dateOfBirth,
        phone,
        email,
        password,
      }
    );

    let savedUser = await user.save();

    if (savedUser) {
      passport.authenticate("local", {
        successRedirect: "/dashboard", //after login success
        successFlash: "You have logged in!"
      })(req, res);
    }
  } catch (error) {
    console.log(error);
  }
});

router.get("/auth/login", (req, res) => {
  res.render("auth/login");
});

router.get("/dashboard", isLoggedIn, (req, res) => {
  res.render("dashboard/index");
});

// Login Route
router.post("/auth/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard", //after login success
    failureRedirect: "/auth/login", //if fail
    failureFlash: "Invalid username or password",
    successFlash: "You have logged in!"
  })
);

// Logout Route
router.get("/auth/logout", (request, response) => {
  request.logout(); //clear and break session
  request.flash("success", "You have logged out!");
  response.redirect("/auth/login");
});

module.exports = router;