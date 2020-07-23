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
    let { 
      firstname, 
      lastname, 
      dateOfBirth, 
      phone,
      email, 
      password 
    } = req.body;

    let emailExists = await User.exists({ email });
    
    let phoneExists = await User.exists({ phone });

    if (!emailExists && !phoneExists) {
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
        req.flash("success", "Account have been created successfully!");
        res.redirect("/auth/login");
      } 
    } else {
      throw { 
        code: "REGISTER_EXISTS", 
      }
    }
  } catch (error) {
    console.log(error);
    if (error.code == "REGISTER_EXISTS") {
      req.flash("error", "Phone number or email address already exists!");
      res.redirect("/auth/register");
    }
  }
});

router.get("/auth/login", (req, res) => {
  res.render("auth/login");
});

router.get("/auth/profile/:id", isLoggedIn, (req, res) => {
  User.findById(req.params.id)
  .then((user) => {
    res.render("auth/profile", { user });
  })
  .catch((err) => {
    console.log(err);
  });
});

router.post("/auth/profile/:id", isLoggedIn, (req, res) => {
  User.findByIdAndUpdate(req.params.id, req.body)
  .then(() => {
    req.flash("success", "Profile updated");
    res.redirect("/dashboard");
  })
  .catch((err) => {
    console.log(err);
  });
});

// Login Route
router.post("/auth/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard", //after login success
    failureRedirect: "/auth/login", //if fail
    failureFlash: "Invalid emaill address or password",
    successFlash: "You have logged in!"
  })
);

// Logout Route
router.get("/auth/logout", (req, res) => {
  req.logout(); //clear and break session
  req.flash("success", "You have logged out!");
  res.redirect("/intro");
});

module.exports = router;