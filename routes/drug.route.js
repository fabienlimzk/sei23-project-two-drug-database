const router = require("express").Router();
const User  = require("../models/user.model");
const Drug = require("../models/drug.model");
const isLoggedIn = require("../config/loginBlocker");

router.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    let user = await User.find()
    let drugs = await Drug.find()
    res.render("dashboard/index", { user, drugs });
  } catch (error){
    console.log(error);
  }
});

router.get("/create", isLoggedIn, (req, res) => {
  res.render("drugs/create");
});

router.post("/create", (req, res) => {
  let data = {
    name: req.body.name,
    drugClass: req.body.drugClass,
    recommendedDose: req.body.recommendedDose,
    description: req.body.description,
    imageUrl: req.body.imageUrl,
    createdBy: req.user._id,
  }

  let drug = new Drug(data);
  console.log(drug);
  drug.save()
  .then(() => {
    User.findByIdAndUpdate(req.user._id, {
      $push: { drugs: drug._id }
    })
    .then(() => {
      req.flash("success", "Drug created!");
      res.redirect("/dashboard");
    });
  })
});

module.exports = router;